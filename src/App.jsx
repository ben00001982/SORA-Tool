import { useState, useEffect, useCallback } from 'react'

// ─── constants ───────────────────────────────────────────────────────────────
const SAIL_BG  = ['','#dbeafe','#bfdbfe','#93c5fd','#fde68a','#fca5a5','#f87171']
const SAIL_FG  = ['','#1e3a8a','#1e40af','#1e3a8a','#78350f','#7f1d1d','#450a0a']
const SAIL_IDX = { I:0, II:1, III:2, IV:3, V:4, VI:5 }
const STORAGE_KEY = 'sora25_tool_v1'
const G = 9.81

const IGRC = {
  0: [1,2,3,4,5,6,7],
  1: [1,3,4,5,6,7,8],
  2: [2,4,5,6,7,8,null],
  3: [3,5,6,7,8,9,null],
  4: [3,6,7,8,9,10,null],
}

const POP_ROWS = [
  { k:'controlled', l:'Controlled ground area' },
  { k:'<5',        l:'< 5 ppl/km²  –  Remote' },
  { k:'<50',       l:'< 50 ppl/km²  –  Lightly populated' },
  { k:'<500',      l:'< 500 ppl/km²  –  Sparsely populated' },
  { k:'<5000',     l:'< 5,000 ppl/km²  –  Suburban' },
  { k:'<50000',    l:'< 50,000 ppl/km²  –  High density metro' },
  { k:'>50000',    l:'> 50,000 ppl/km²  –  Assemblies of people' },
]

const AEC_LIST = [
  { id:'AEC1',  d:'Airport/Heliport – Class B/C/D airspace',       arc:'d' },
  { id:'AEC2',  d:'TMZ / Mode-S veil  >500 ft AGL',                arc:'d' },
  { id:'AEC3',  d:'Controlled airspace  >500 ft AGL',              arc:'d' },
  { id:'AEC4',  d:'Uncontrolled airspace  >500 ft AGL  urban',     arc:'c' },
  { id:'AEC5',  d:'Uncontrolled airspace  >500 ft AGL  rural',     arc:'c' },
  { id:'AEC6',  d:'Airport/Heliport – Class E/F/G airspace',       arc:'c' },
  { id:'AEC7',  d:'TMZ / Mode-S veil  <500 ft AGL',                arc:'c' },
  { id:'AEC8',  d:'Controlled airspace  <500 ft AGL',              arc:'c' },
  { id:'AEC9',  d:'Uncontrolled airspace  <500 ft AGL  urban',     arc:'c' },
  { id:'AEC10', d:'Uncontrolled airspace  <500 ft AGL  rural',     arc:'b' },
  { id:'AEC11', d:'Above FL600',                                    arc:'b' },
  { id:'AEC12', d:'Atypical / segregated airspace',                arc:'a' },
]

const SAIL_TABLE = [
  { g:1, a:'I',   b:'II',  c:'IV', d:'VI' },
  { g:2, a:'I',   b:'II',  c:'IV', d:'VI' },
  { g:3, a:'II',  b:'II',  c:'IV', d:'VI' },
  { g:4, a:'III', b:'III', c:'IV', d:'VI' },
  { g:5, a:'IV',  b:'IV',  c:'IV', d:'VI' },
  { g:6, a:'V',   b:'V',   c:'V',  d:'VI' },
  { g:7, a:'VI',  b:'VI',  c:'VI', d:'VI' },
]

// ─── OSO data ─────────────────────────────────────────────────────────────────
const OSO_LIST = [
  { id:'OSO#01', s:'Operator competent / proven',               sc:'Operator', cat:'Ops',    lvl:['NR','L','M','H','H','H'] },
  { id:'OSO#02', s:'UAS manufactured by competent entity',      sc:'Designer', cat:'Design', lvl:['NR','NR','L','M','H','H'] },
  { id:'OSO#03', s:'UAS maintained by competent entity',        sc:'Both',     cat:'Ops',    lvl:['L','L','M','M','H','H'] },
  { id:'OSO#04', s:'Components designed to ADS',                sc:'Designer', cat:'Design', lvl:['NR','NR','NR','L','M','H'] },
  { id:'OSO#05', s:'System safety & reliability',               sc:'Designer', cat:'Design', lvl:['NR','NR*','L','M','H','H'] },
  { id:'OSO#06', s:'C3 link appropriate for the operation',     sc:'Both',     cat:'System', lvl:['NR','L','L','M','H','H'] },
  { id:'OSO#07', s:'Conformity check of UAS configuration',     sc:'Operator', cat:'Ops',    lvl:['L','L','M','M','H','H'] },
  { id:'OSO#08', s:'Operational procedures',                    sc:'Operator', cat:'Ops',    lvl:['L','M','H','H','H','H'] },
  { id:'OSO#09', s:'Remote crew trained and current',           sc:'Operator', cat:'Crew',   lvl:['L','L','M','M','H','H'] },
  { id:'OSO#13', s:'External services adequate',                sc:'Operator', cat:'System', lvl:['L','L','M','H','H','H'] },
  { id:'OSO#16', s:'Multi-crew coordination',                   sc:'Operator', cat:'Crew',   lvl:['L','L','M','M','H','H'] },
  { id:'OSO#17', s:'Remote crew fit to operate',                sc:'Operator', cat:'Crew',   lvl:['L','L','M','M','H','H'] },
  { id:'OSO#18', s:'Auto protection of flight envelope',        sc:'Designer', cat:'System', lvl:['NR','NR','L','M','H','H'] },
  { id:'OSO#19', s:'Safe recovery from human error',            sc:'Designer', cat:'System', lvl:['NR','NR','L','M','M','H'] },
  { id:'OSO#20', s:'HMI evaluated for the mission',             sc:'Both',     cat:'Crew',   lvl:['NR','L','L','M','M','H'] },
  { id:'OSO#23', s:'Environmental conditions defined',          sc:'Both',     cat:'Ops',    lvl:['L','L','M','M','H','H'] },
  { id:'OSO#24', s:'Designed for adverse environments',         sc:'Designer', cat:'Design', lvl:['NR','NR','M','H','H','H'] },
]

const OSO_MOC = {
  'OSO#01': {
    L:['Operations Manual: checklists, maintenance, training, responsibilities','Awareness of airworthiness directives and designer service bulletins'],
    M:['Continuous compliance monitoring / audit programme','Occurrence reporting and analysis feeding back to designer','Safety Management System (lite) per ICAO Doc 9859'],
    H:['Full SMS per ICAO Annex 19','Organisational Operating Certificate (OOC) or equivalent','Recurrent 3rd-party audit prior to first ops and recurrently thereafter'],
  },
  'OSO#02': {
    L:['Manufacturing procedures covering materials, durability, repeatability, configuration control','Declaration to authority-accepted standard'],
    M:['Same as Low plus incoming product verification, in-process and final inspections, tooling calibration, non-conformance control','Build records and acceptance test reports','ISO 9001 or equivalent QMS'],
    H:['Same as Medium plus personnel competence & qualification, supplier control','Recurrent process/product audit by competent 3rd party','EASA Part 21 Subpart G or equivalent production organisation approval'],
  },
  'OSO#03': {
    L:['Maintenance instructions (may reuse designer ICA)','Maintenance log recording all work','List of authorised maintenance staff'],
    M:['Scheduled maintenance programme per designer requirements','Programme per authority-accepted standard (e.g. EASA Part M)','Release-to-service only by authorised staff — initial training per UA model/family'],
    H:['Maintenance Procedure Manual','Recurrent training for release-to-service staff validated by competent 3rd party','EASA Part 145 or equivalent approval'],
  },
  'OSO#04': {
    L:['Apply an authority-accepted Airworthiness Design Standard (ADS):','  • EASA SC Light-UAS (Medium Risk: SAIL III–IV / High Risk: SAIL V–VI)','  • JARUS CS-LURS (unmanned rotorcraft, ≤750 kg)','  • JARUS CS-LUAS (unmanned fixed-wing, ≤750 kg)','  • EASA SC-VTOL (VTOL/hybrid, ≤3,175 kg)','  • NATO STANAG 4671 / AEP-4671 (fixed-wing military, 150–20,000 kg)','  • ASTM F3298 (fixed-wing lightweight UAS — paywalled)','Declaration that ADS compliance contributes to 10⁻⁴/FH LOC objective','Alternatively: 30,000 FTB flight hours per ASTM F3478-20 (SAIL IV only)','→ Use the ADS Matrix tab in Phase 4 for full requirement-level tracking'],
    M:['Same as Low plus supporting evidence (testing, analysis, simulation, inspection)','ADS compliance contributing to 10⁻⁵/FH LOC objective','EASA DVR (Design Verification Report) for M2 High robustness or enhanced containment'],
    H:['3rd-party validated design review and test reports','ADS compliance contributing to 10⁻⁶/FH LOC objective','Type Certificate application under EASA Part 21 / 14 CFR Part 21 (SAIL V/VI pathway)'],
  },
  'OSO#05': {
    L:['Functional Hazard Assessment (FHA) per EUROCAE ED-280 or EUROCAE ED-279','Design and installation appraisal per ASTM F3309-21 showing hazards minimised','UK CAA CAP 722A Volume 2 §2.4 (Safety Features of UAS) acceptable alternative'],
    M:['Safety assessment per EUROCAE ED-280 or SAE ARP4754A / EUROCAE ED-79A','Strategy for detection of single failures including pre-flight checks','SW/AEH development per RTCA DO-178C and RTCA DO-254 at applicable DAL','Reference: JARUS AMC RPAS.1309 Issue 2 Table 3 for DAL derivation'],
    H:['All assessments validated by competent 3rd party','EASA MoC OSO#05/10/12-01 or equivalent authority-accepted MoC'],
  },
  'OSO#06': {
    L:['Declaration that C2 link performance is adequate for the operation','Document link technology, frequency band, power, range and latency','Spectrum authorisation / frequency licence per national rules','Compliance with Radio Equipment Directive (EU) 2014/53/EU or equivalent'],
    M:['Test evidence of C2 link performance across operational range','ETSI EN 300 328 / EN 301 893 spectrum standards where applicable','Link-loss contingency procedure and failsafe behaviour documented'],
    H:['3rd-party verified link performance','EUROCAE ED-228 (MASPS for C2 datalink) compliance','Cybersecurity assessment per SORA Cyber Extension / EUROCAE ED-203'],
  },
  'OSO#07': {
    L:['Pre-flight configuration checklist (hardware and software versions verified)','Maintenance log confirming UAS is in conforming state'],
    M:['Configuration control procedure covering change management and version history','Authority-accepted configuration management plan'],
    H:['Configuration management process audited by competent 3rd party','SAE ARP4754A / ED-79A §7 configuration management principles'],
  },
  'OSO#08': {
    L:['Operations Manual: normal, contingency and emergency procedures','Checklists for pre-flight, in-flight and post-flight phases'],
    M:['OM validated through testing, simulations or operational data','Evidence that remote crew are trained on the OM'],
    H:['OM validated by competent 3rd party reviewer','Training records demonstrating crew adherence to OM'],
  },
  'OSO#09': {
    L:['Training records for all crew (remote pilot, observers)','National remote pilot competency certificate where applicable'],
    M:['Formal training syllabus with theoretical and practical elements, duration and pass criteria','Recurrent competency check records'],
    H:['Recurrent training programme validated by competent 3rd party','Approved Training Organisation (ATO) or equivalent recognition'],
  },
  'OSO#13': {
    L:['List all critical external services (UTM, weather, comms, power)','Declaration each service meets performance needs for safe operation','Service Level Agreements (SLAs) with each critical service provider'],
    M:['Evidence of service performance for each critical service','Contingency procedure for loss of each critical service','UTM compliance with applicable U-space regulation'],
    H:['Critical services independently validated against SORA performance requirements','EUROCAE ED-269 (MASPS for UTM) compliance for UTM services','EU U-space Regulation 2021/664 compliance'],
  },
  'OSO#16': {
    L:['Documented crew roles, responsibilities, handover procedures and standard phraseology'],
    M:['CRM training covering communication, workload management, situational awareness, decision-making','Training records demonstrating all crew have completed CRM training'],
    H:['CRM training programme validated by competent 3rd party','Line-check or operational evaluation by independent assessor','Annual recurrent CRM with documented assessment'],
  },
  'OSO#17': {
    L:['Fitness-for-duty declaration by remote pilot before each operation','Crew self-reporting procedure for illness or incapacitation'],
    M:['Fatigue risk management policy for crew scheduling','Max duty day and min rest periods documented'],
    H:['Periodic medical assessment by aviation medical examiner (AME)','Fatigue Risk Management System (FRMS) per ICAO Doc 9966'],
  },
  'OSO#18': {
    L:['Declaration of envelope protection in place (geofencing, speed/altitude limiting)','Pre-flight verification that protection systems are active and functional'],
    M:['Envelope protection validated through flight testing or simulation','EUROCAE ED-280 envelope protection analysis','Failure mode analysis showing protection failures are not catastrophic'],
    H:['3rd-party validated envelope protection test reports','Failure probability consistent with SAIL V/VI system safety objectives'],
  },
  'OSO#19': {
    L:['Return-to-Home (RTH) or safe-landing capability declared and described','Loss-of-link failsafe behaviour documented (hover, RTH, land, terminate)'],
    M:['Recovery functions validated through testing per defined test plan','EUROCAE ED-280 recovery function analysis','Pre-flight check that RTH/failsafe is functional'],
    H:['Recovery functions validated by competent 3rd party','3rd-party witnessed flight testing of all recovery modes'],
  },
  'OSO#20': {
    L:['GCS HMI description (display layout, control interfaces, alerting)','Basic task analysis for critical tasks'],
    M:['HMI evaluation through operational testing with representative crew','Human error risk assessment for critical HMI actions'],
    H:['Formal Human Factors study per EASA AMC 20-25 or equivalent','Usability testing with independent HF specialist','3rd-party HF validation report'],
  },
  'OSO#23': {
    L:['Operational limits defined in OM: max wind, temperature, precipitation, visibility','Pre-flight weather check procedure (METAR, TAF, ATIS or equivalent)'],
    M:['Monitoring procedures with evidence (anemometer records, weather logs)','Documented go/no-go criteria and decision authority'],
    H:['Environmental monitoring system validated by competent 3rd party','Limits independently verified as measurable and observable in flight'],
  },
  'OSO#24': {
    M:['Environmental qualification testing: temperature, humidity, rain, vibration, EMC','Test standard: RTCA DO-160G / EUROCAE ED-14G or equivalent','IP rating per IEC 60529 if moisture exposure relevant','MIL-STD-810H for harsh-environment or defence context'],
    H:['Same as Medium validated by competent 3rd party','Full RTCA DO-160G section compliance record','Icing: EUROCAE ED-103A or equivalent if icing exposure relevant'],
  },
}

// ─── ADS data ─────────────────────────────────────────────────────────────────
const ADS_LIST = [
  { id:'CS_LURS',    name:'JARUS CS-LURS',       full:'Certification Specification for Light Unmanned Rotorcraft Systems', version:'Ed.1, Oct 2013',   url:'http://jarus-rpas.org/wp-content/uploads/2023/06/jar_01_doc_CS_LURS.pdf',         types:['rotorcraft'],            mtom:'≤750 kg',         color:'#1d4ed8', bg:'#dbeafe', access:'Public' },
  { id:'CS_LUAS',    name:'JARUS CS-LUAS',       full:'Certification Specification for Light Unmanned Aeroplane Systems',  version:'Ed.1, Dec 2016',   url:'http://jarus-rpas.org/wp-content/uploads/2023/06/jar_07_doc_CS_LUAS.pdf',         types:['fixed_wing','vtol'],     mtom:'≤750 kg',         color:'#15803d', bg:'#dcfce7', access:'Public' },
  { id:'SC_LightUAS',name:'EASA SC Light-UAS',   full:'Special Condition Light UAS (Medium & High Risk)',                  version:'Med: Dec 2020; High: Dec 2021', url:'https://www.easa.europa.eu/en/special-condition-sc-light-uas-medium-risk', types:['rotorcraft','fixed_wing','vtol'], mtom:'≤25 kg', color:'#7c3aed', bg:'#ede9fe', access:'Public' },
  { id:'SC_VTOL',    name:'EASA SC-VTOL',         full:'Special Condition for VTOL Aircraft',                               version:'Issue 1',          url:'https://www.easa.europa.eu/en/document-library/product-certification-consultations/special-condition-vtol', types:['vtol'], mtom:'≤3,175 kg', color:'#c2410c', bg:'#fff7ed', access:'Public' },
  { id:'STANAG4671', name:'NATO STANAG 4671',     full:'Unmanned Aircraft Systems Airworthiness Requirements (USAR)',       version:'Ed.3 / AEP-4671 Ed.B', url:'https://nso.nato.int', types:['fixed_wing'], mtom:'150 kg – 20,000 kg', color:'#1e3a8a', bg:'#dbeafe', access:'Ed.1 partial; Ed.2/3 NATO access' },
  { id:'ASTM_F3298', name:'ASTM F3298',           full:'Standard Specification for Design, Construction and Verification of Fixed-Wing UAS', version:'F3298-24', url:'https://store.astm.org/f3298-24.html', types:['fixed_wing'], mtom:'Light UAS', color:'#92400e', bg:'#fef3c7', access:'Paywalled – purchase from ASTM' },
]

const ADS_REQS = {
  CS_LURS: [
    { id:'LURS.1309', sub:'Systems',     crit:'critical', title:'Equipment, systems & installations',    text:'Safety-critical systems must perform intended functions under all operating and environmental conditions. Functional Hazard Assessment (FHA) + FMEA/FTA per JARUS AMC RPAS.1309 Issue 2. No single failure may cause a catastrophic failure condition.' },
    { id:'LURS.65',   sub:'Flight',      crit:'critical', title:'Controllability and manoeuvrability',   text:'The RPAS must be safely controllable and manoeuvrable during each phase of flight and when transitioning between phases, for each practicable combination of weight and centre of gravity.' },
    { id:'LURS.67',   sub:'Flight',      crit:'major',    title:'Stability',                             text:'The RPAS must have adequate stability in all approved flight configurations. No divergent oscillation that cannot be safely countered by the remote crew.' },
    { id:'LURS.301',  sub:'Structure',   crit:'critical', title:'Loads – general',                       text:'Limit loads are the maximum loads expected in service. Structure must support limit loads without detrimental permanent deformation and ultimate loads (limit × 1.5) without failure for at least 3 seconds.' },
    { id:'LURS.547',  sub:'Structure',   crit:'critical', title:'Main rotor structure',                  text:'Rotor blades, hub and control components must withstand fatigue loads throughout service life. Fatigue life or damage tolerance established by test or validated analysis. Replacement times defined in ICA.' },
    { id:'LURS.917',  sub:'Powerplant',  crit:'critical', title:'Rotor drive system',                    text:'Drive system must safely transmit design loads. Must withstand vibration and transient loads. Fatigue life established and documented in Instructions for Continued Airworthiness.' },
    { id:'LURS.629',  sub:'Design',      crit:'critical', title:'Flutter',                               text:'Must be free from flutter, control reversal and divergence throughout the operational envelope and at 15% above VNE. Substantiated by analysis with test confirmation.' },
    { id:'LURS.1351', sub:'Electrical',  crit:'critical', title:'Electrical systems',                    text:'Electrical capacity must be adequate for all loads. Critical systems protected against fault currents. Backup power required for safety-critical consumers.' },
    { id:'LURS.1607', sub:'C2 Link',     crit:'critical', title:'C&C datalink performance',              text:'Must meet the Required Link Performance (RLP) for intended operations. Reliability, latency and error rate requirements demonstrated. Frequency authorisation required.' },
    { id:'LURS.1609', sub:'C2 Link',     crit:'critical', title:'Loss of C&C datalink',                  text:'Automatic procedures upon link loss must result in a safe outcome throughout all flight phases. Verified in flight tests. Documented in the Rotorcraft Flight Manual.' },
    { id:'LURS.1529', sub:'ICA',         crit:'major',    title:'Instructions for Continued Airworthiness', text:'ICA must include maintenance instructions, schedules, troubleshooting, inspection intervals and overhaul periods. An airworthiness limitations section must be clearly identified.' },
    { id:'LURS.1581', sub:'Limitations', crit:'major',    title:'Rotorcraft Flight Manual',              text:'RFM or equivalent must include operating limitations, emergency procedures, normal procedures and performance information adequate for the remote crew.' },
    { id:'LURS.1603', sub:'GCS',         crit:'major',    title:'Control station – general',             text:'UCS must allow the remote crew to control the RPAS safely throughout all flight phases. Crew workload must not exceed acceptable limits during normal and emergency operations.' },
  ],
  CS_LUAS: [
    { id:'LUAS.1309', sub:'Systems',     crit:'critical', title:'Equipment, systems & installations',    text:'Safety-critical systems must perform intended functions under all conditions. No single failure causing a catastrophic condition. Safety assessment per JARUS AMC RPAS.1309 Issue 2.' },
    { id:'LUAS.65',   sub:'Flight',      crit:'critical', title:'Controllability and manoeuvrability',   text:'The aeroplane must be safely controllable and manoeuvrable during each phase of flight. Maximum forces applied by the remote pilot must not be exceeded during normal operations.' },
    { id:'LUAS.171',  sub:'Flight',      crit:'major',    title:'Static longitudinal stability',         text:'Must have positive static longitudinal stability in all approved flight configurations across the full centre-of-gravity range.' },
    { id:'LUAS.301',  sub:'Structure',   crit:'critical', title:'Loads – general',                       text:'Limit and ultimate loads (× 1.5) must be established for all critical flight conditions. Structure must withstand limit loads without detrimental deformation and ultimate loads without failure.' },
    { id:'LUAS.571',  sub:'Structure',   crit:'critical', title:'Structural fatigue',                    text:'Safe-life or damage-tolerance methodology. Fatigue life based on design usage spectrum. All fatigue-critical parts and replacement intervals addressed in ICA.' },
    { id:'LUAS.629',  sub:'Design',      crit:'critical', title:'Flutter',                               text:'Must be free from flutter, control reversal and divergence throughout the operational envelope and at 15% above VNE. Analysis substantiated by flutter margin testing.' },
    { id:'LUAS.1351', sub:'Electrical',  crit:'critical', title:'Electrical systems',                    text:'Electrical capacity adequate for all loads. Critical systems protected against fault currents. Backup power for safety-critical consumers.' },
    { id:'LUAS.1607', sub:'C2 Link',     crit:'critical', title:'C&C datalink performance',              text:'Must meet Required Link Performance for intended operations. Reliability, latency and availability demonstrated. Link-loss contingency established and documented.' },
    { id:'LUAS.1609', sub:'C2 Link',     crit:'critical', title:'Loss of C&C datalink',                  text:'Automatic contingency procedures upon link loss must result in a safe outcome. Demonstrated in flight tests. Documented in AFM/Flight Manual equivalent.' },
    { id:'LUAS.1529', sub:'ICA',         crit:'major',    title:'Instructions for Continued Airworthiness', text:'ICA must include maintenance instructions, schedules, inspection requirements and an airworthiness limitations section clearly identified and approved.' },
    { id:'LUAS.1603', sub:'GCS',         crit:'major',    title:'Control station – general',             text:'UCS must enable safe control throughout all flight phases. Crew workload manageable. HMI designed to minimise error potential.' },
  ],
  SC_LightUAS: [
    { id:'LU.2510',   sub:'Systems',     crit:'critical', title:'Equipment, systems & installation',     text:'Safety objectives: 10⁻⁴/FH (Medium Risk / SAIL III–IV); 10⁻⁵/FH (High Risk / SAIL V–VI). No catastrophic failure from single failure. DAL assignments from safety analysis per RTCA DO-178C / DO-254.' },
    { id:'LU.2405',   sub:'Powerplant',  crit:'critical', title:'Lift/Thrust/Power system integrity',    text:'Structural integrity throughout service life. Fatigue life or damage tolerance established. Replacement intervals defined in ICA. Reference: MOC Light-UAS.2405.' },
    { id:'LU.2410',   sub:'Powerplant',  crit:'major',    title:'Lift/Thrust/Power system endurance',    text:'Endurance and durability requirements demonstrated by test or validated analysis. Reference: MOC Light-UAS.2410.' },
    { id:'LU.300',    sub:'Structure',   crit:'critical', title:'Structural loads',                      text:'Design loads for each structural component established. Limit and ultimate loads defined. Factor of safety ≥ 1.5.' },
    { id:'LU.500',    sub:'Flight',      crit:'major',    title:'Flight envelope',                       text:'Normal, operational and limit envelopes defined for each flight configuration. Wind, rain and temperature environmental conditions accounted for.' },
    { id:'LU.700',    sub:'Flight',      crit:'critical', title:'Stability and control',                 text:'Adequate stability and control throughout operational envelope. Dynamic stability requirements met. No adverse pilot-induced oscillation characteristics.' },
    { id:'LU.2600',   sub:'C2 Link',     crit:'critical', title:'C2 link',                               text:'C2 link must meet required performance per EASA SC-RPAS.C2-01 including reliability, latency, range and spectrum authorisation.' },
    { id:'LU.2615',   sub:'Systems',     crit:'major',    title:'Flight, navigation and instruments',    text:'Instruments required for intended operations installed and calibrated. Accuracy and reliability appropriate for the operations. Reference: MOC Light-UAS.2615.' },
    { id:'LU.2700',   sub:'GCS',         crit:'major',    title:'Remote crew interface',                 text:'GCS provides crew all information needed for safe flight. Design minimises potential for crew error. HMI appropriate for the mission.' },
    { id:'LU.ICA',    sub:'ICA',         crit:'major',    title:'Instructions for Continued Airworthiness', text:'ICA produced and approved, including maintenance instructions, schedules, inspection requirements and airworthiness limitations section.' },
  ],
  SC_VTOL: [
    { id:'VTOL.2510', sub:'Systems',     crit:'critical', title:'Equipment, systems & installations',    text:'Category Basic: 10⁻⁵/FH (catastrophic); Category Enhanced: 10⁻⁶/FH. FDAL assignments from safety analysis. RTCA DO-178C / DO-254 for SW/AEH.' },
    { id:'VTOL.2400', sub:'Powerplant',  crit:'critical', title:'Distributed lift/thrust/power',         text:'Each distributed lift/thrust unit designed for continued safe operation. Loss of a single propulsion unit must not cause loss of control of the aircraft.' },
    { id:'VTOL.700',  sub:'Flight',      crit:'critical', title:'Stability and control – all phases',    text:'Adequate stability and controllability throughout VTOL, transition and cruise flight phases. No hazardous characteristics in any phase or combination.' },
    { id:'VTOL.500',  sub:'Flight',      crit:'major',    title:'Flight envelope – all phases',          text:'Normal, operational and limit envelopes for VTOL, transition and forward flight. Conversion envelope and all associated limitations established.' },
    { id:'VTOL.305',  sub:'Structure',   crit:'critical', title:'Structural loads',                      text:'Design loads must account for all flight phases including VTOL operations, gust loads during transition, and critical combination conditions. Factor of safety ≥ 1.5.' },
    { id:'VTOL.2600', sub:'C2 Link',     crit:'critical', title:'C2 link (unmanned operations)',         text:'For unmanned VTOL, C2 link must meet performance requirements. Link-loss procedures must result in safe outcomes in all phases including during phase transition.' },
    { id:'VTOL.800',  sub:'Limitations', crit:'major',    title:'Operating limitations',                 text:'VTOL-specific limitations: conversion corridors, crosswind limits for VTOL operations, height-velocity diagrams, phase-specific limitations.' },
    { id:'VTOL.ICA',  sub:'ICA',         crit:'major',    title:'Instructions for Continued Airworthiness', text:'ICA addressing VTOL-specific maintenance requirements including distributed propulsion systems, conversion mechanisms and novel structural elements.' },
  ],
  STANAG4671: [
    { id:'USAR.1309', sub:'Systems',     crit:'critical', title:'Equipment, systems & installations',    text:'Systems must perform intended functions under all conditions. Safety assessment per SAE ARP4761 / JARUS AMC RPAS.1309. No single failure may cause a catastrophic condition.' },
    { id:'USAR.65',   sub:'Flight',      crit:'critical', title:'Controllability and manoeuvrability',   text:'UAV must be safely controllable throughout operational envelope. Directional and lateral control requirements. Autopilot system reliability requirements apply.' },
    { id:'USAR.301',  sub:'Structure',   crit:'critical', title:'Loads – general',                       text:'Limit and ultimate loads established for all critical conditions. Factor of safety 1.5. Design usage spectrum forms basis for fatigue analysis.' },
    { id:'USAR.571',  sub:'Structure',   crit:'critical', title:'Structural fatigue evaluation',         text:'Safe-life or damage-tolerance methodology. Fatigue life based on design usage spectrum. Replacement intervals and inspection requirements in ICA.' },
    { id:'USAR.629',  sub:'Design',      crit:'critical', title:'Flutter',                               text:'Must be free from flutter, control reversal and divergence throughout envelope and at 15% above VD / VNE. Analysis with test substantiation required.' },
    { id:'USAR.1607', sub:'C2 Link',     crit:'critical', title:'C&C datalink',                          text:'Must meet performance requirements: reliability, latency and availability. Link-loss behaviour must result in a safe outcome throughout all mission phases.' },
    { id:'USAR.1529', sub:'ICA',         crit:'major',    title:'Instructions for Continued Airworthiness', text:'ICA including maintenance instructions, schedules, inspection intervals, overhaul periods and airworthiness limitations. Must be approved by certifying authority.' },
    { id:'USAR.1601', sub:'GCS',         crit:'major',    title:'UAV control station',                   text:'UCS must provide safe control throughout all flight phases. Crew workload must not exceed safe limits during normal and emergency operations.' },
    { id:'USAR.1351', sub:'Electrical',  crit:'critical', title:'Electrical systems',                    text:'Electrical capacity adequate for all loads. Protection against fault currents. Backup power for safety-critical loads. EMC requirements.' },
  ],
  ASTM_F3298: [
    { id:'F3298.S5',  sub:'Flight',      crit:'major',    title:'Performance requirements',              text:'Flight performance requirements for all phases of intended operations. Envelope limits must be established and demonstrated. [Full requirement text requires purchase from store.astm.org]' },
    { id:'F3298.S6',  sub:'Structure',   crit:'critical', title:'Structural requirements',               text:'Design load requirements, material properties and structural testing/analysis. Fatigue requirements for repetitive load path components. [Full text paywalled – ASTM F3298 §6]' },
    { id:'F3298.S9',  sub:'Systems',     crit:'critical', title:'Avionics and systems',                  text:'Equipment, systems and installation requirements. Safety assessment requirements. Software and hardware development assurance. [Full text paywalled – ASTM F3298 §9]' },
    { id:'F3298.S11', sub:'C2 Link',     crit:'critical', title:'C2 link requirements',                  text:'Command and control datalink performance, reliability and link-loss behaviour requirements. [Full text paywalled – ASTM F3298 §11]' },
    { id:'F3298.S12', sub:'ICA',         crit:'major',    title:'Continued airworthiness',               text:'Maintenance instructions, schedules and inspection requirements. [Full text paywalled – ASTM F3298 §12]' },
  ],
}

const ADS_SUBS = ['All','Systems','Flight','Structure','Powerplant','Design','C2 Link','Electrical','GCS','Limitations','ICA']

// ─── helpers ─────────────────────────────────────────────────────────────────
const fv = v => parseFloat(v) || 0
const rd = (n, d=1) => isNaN(n) || n === null ? '—' : Number(n).toFixed(d)

function getSAIL(grc, arc) {
  if (grc > 7) return 'CERT'
  const row = SAIL_TABLE.find(r => r.g === Math.min(grc, 7))
  return row?.[arc] || null
}

function applyMit(igrc, m) {
  let x = igrc
  if (m.m1a === 'low')    x -= 1
  if (m.m1a === 'medium') x -= 2
  if (m.m1a !== 'medium') {
    if (m.m1b === 'medium') x -= 1
    if (m.m1b === 'high')   x -= 2
  }
  if (m.m1c === 'low')    x -= 1
  if (m.m2  === 'medium') x -= 1
  if (m.m2  === 'high')   x -= 2
  return Math.max(1, x)
}

// ─── shared UI components ─────────────────────────────────────────────────────
function SailChip({ sail }) {
  if (!sail) return null
  const i = SAIL_IDX[sail] ?? 0
  return (
    <span style={{ display:'inline-block', padding:'2px 10px', fontSize:13, fontWeight:600, borderRadius:5,
      background:SAIL_BG[i+1], color:SAIL_FG[i+1], border:`1.5px solid ${SAIL_FG[i+1]}` }}>
      SAIL {sail}
    </span>
  )
}

const LVL_STYLE = {
  NR:  { bg:'#f3f4f6', c:'#9ca3af' },
  'NR*':{ bg:'#f3f4f6', c:'#9ca3af' },
  L:   { bg:'#dbeafe', c:'#1e40af' },
  M:   { bg:'#fef3c7', c:'#92400e' },
  H:   { bg:'#fee2e2', c:'#991b1b' },
}
function LBadge({ l }) {
  const s = LVL_STYLE[l] || LVL_STYLE.NR
  return <span style={{ display:'inline-block', padding:'1px 7px', fontSize:11, fontWeight:600, borderRadius:4, background:s.bg, color:s.c }}>{l}</span>
}

const ST_META = {
  not_started: { l:'Not started',       bg:'#f3f4f6', c:'#9ca3af', dot:'#9ca3af' },
  in_progress:  { l:'In progress',      bg:'#fef3c7', c:'#92400e', dot:'#f59e0b' },
  declared:     { l:'Declared',         bg:'#dbeafe', c:'#1e40af', dot:'#3b82f6' },
  evidence:     { l:'Evidence held',    bg:'#ede9fe', c:'#5b21b6', dot:'#7c3aed' },
  third_party:  { l:'3rd-party verified', bg:'#dcfce7', c:'#15803d', dot:'#22c55e' },
  compliant:    { l:'Compliant',        bg:'#dcfce7', c:'#15803d', dot:'#22c55e' },
  na:           { l:'N/A',             bg:'#f3f4f6', c:'#6b7280', dot:'#d1d5db' },
}
function StatusBadge({ st }) {
  const m = ST_META[st] || ST_META.not_started
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'2px 8px', fontSize:11, fontWeight:500,
      borderRadius:4, background:m.bg, color:m.c, whiteSpace:'nowrap' }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:m.dot, flexShrink:0 }} />
      {m.l}
    </span>
  )
}
function StatusPicker({ value, onChange, keys }) {
  const ks = keys || Object.keys(ST_META)
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
      {ks.map(k => {
        const m = ST_META[k]
        return (
          <button key={k} onClick={() => onChange(k)} style={{
            padding:'3px 9px', fontSize:11, borderRadius:4, cursor:'pointer', fontWeight:500,
            display:'inline-flex', alignItems:'center', gap:4,
            border: value===k ? `2px solid ${m.dot}` : '0.5px solid var(--color-border-secondary)',
            background: value===k ? m.bg : 'var(--color-background-primary)',
            color: value===k ? m.c : 'var(--color-text-secondary)',
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:m.dot }} />
            {m.l}
          </button>
        )
      })}
    </div>
  )
}

function Card({ children, style={} }) {
  return (
    <div style={{ border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', padding:16, ...style }}>
      {children}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom: hint?3:5 }}>{label}</label>
      {hint && <div style={{ fontSize:10, color:'var(--color-text-secondary)', marginBottom:4 }}>{hint}</div>}
      {children}
    </div>
  )
}

function TInput({ value, onChange, placeholder, type='text', step, min }) {
  return (
    <input type={type} step={step} min={min} value={value||''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width:'100%', padding:'7px 10px', fontSize:13, borderRadius:'var(--border-radius-md)',
        border:'0.5px solid var(--color-border-secondary)',
        background:'var(--color-background-primary)', color:'var(--color-text-primary)', boxSizing:'border-box' }} />
  )
}

function SSelect({ value, onChange, opts }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width:'100%', padding:'7px 10px', fontSize:13, borderRadius:'var(--border-radius-md)',
        border:'0.5px solid var(--color-border-secondary)',
        background:'var(--color-background-primary)', color:'var(--color-text-primary)' }}>
      {opts.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
    </select>
  )
}

function Radios({ value, onChange, opts }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {opts.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          padding:'5px 12px', fontSize:12, fontWeight:500, borderRadius:'var(--border-radius-md)', cursor:'pointer',
          border: value===o.v ? '2px solid #1d4ed8' : '0.5px solid var(--color-border-secondary)',
          background: value===o.v ? '#dbeafe' : 'var(--color-background-primary)',
          color: value===o.v ? '#1e40af' : 'var(--color-text-primary)',
        }}>{o.l}</button>
      ))}
    </div>
  )
}

function DocField({ label, value, onChange, ph }) {
  return (
    <div style={{ marginBottom:7 }}>
      <label style={{ fontSize:11, color:'var(--color-text-secondary)', display:'block', marginBottom:2 }}>{label}</label>
      <input value={value||''} onChange={e => onChange(e.target.value)} placeholder={ph}
        style={{ width:'100%', padding:'5px 8px', fontSize:11, borderRadius:'var(--border-radius-md)',
          border:'0.5px solid var(--color-border-secondary)',
          background:'var(--color-background-primary)', color:'var(--color-text-primary)', boxSizing:'border-box' }} />
    </div>
  )
}

function NotesField({ value, onChange }) {
  return (
    <div>
      <label style={{ fontSize:11, color:'var(--color-text-secondary)', display:'block', marginBottom:2 }}>Notes / gaps / open actions</label>
      <textarea value={value||''} onChange={e => onChange(e.target.value)} rows={2}
        placeholder="Document gaps, planned actions, due dates..."
        style={{ width:'100%', padding:'5px 8px', fontSize:11, borderRadius:'var(--border-radius-md)',
          border:'0.5px solid var(--color-border-secondary)',
          background:'var(--color-background-primary)', color:'var(--color-text-primary)',
          boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
    </div>
  )
}

function GRow({ l, v, u, n }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
      <span style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{l}</span>
      <span style={{ fontSize:11, fontWeight:500 }}>{v} <span style={{ fontSize:10, color:'var(--color-text-tertiary)' }}>{u}{n ? ' — ' + n : ''}</span></span>
    </div>
  )
}

// ─── PHASE 1 – UA Definition ──────────────────────────────────────────────────
function Phase1({ ua, set }) {
  const is250 = fv(ua.mtom) > 0 && fv(ua.mtom) <= 0.25 && fv(ua.speed) <= 25
  return (
    <div>
      <p style={{ fontSize:13, color:'var(--color-text-secondary)', marginBottom:20 }}>
        Define the unmanned aircraft and its key physical characteristics. These values feed directly into the iGRC calculation, CV/GRB calculator and ADS applicability.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <Card>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Aircraft identification</div>
          <Field label="UA designation / project name">
            <TInput value={ua.name} onChange={v => set(p => ({ ...p, name:v }))} placeholder="e.g. AeroSurveyor Pro" />
          </Field>
          <Field label="UA type">
            <Radios value={ua.type} onChange={v => set(p => ({ ...p, type:v }))}
              opts={[{ v:'rotorcraft', l:'Rotary wing' }, { v:'fixed_wing', l:'Fixed-wing' }, { v:'vtol', l:'VTOL / hybrid' }]} />
          </Field>
          <Field label="Maximum take-off mass (kg)" hint="MTOM — determines 250 g threshold and ADS applicability">
            <TInput value={ua.mtom} onChange={v => set(p => ({ ...p, mtom:v }))} placeholder="e.g. 25" type="number" step="0.1" min="0" />
          </Field>
          {is250 && (
            <div style={{ padding:'8px 12px', background:'#dcfce7', borderRadius:'var(--border-radius-md)', fontSize:12, color:'#15803d', marginBottom:12 }}>
              ≤250 g and ≤25 m/s → automatic iGRC = 1 regardless of population density (SORA Table 2 rule)
            </div>
          )}
          <Field label="Manufacturer / design organisation">
            <TInput value={ua.manufacturer} onChange={v => set(p => ({ ...p, manufacturer:v }))} placeholder="e.g. Acme Aerospace Ltd" />
          </Field>
          <Field label="Programme phase">
            <TInput value={ua.phase} onChange={v => set(p => ({ ...p, phase:v }))} placeholder="e.g. Preliminary Design, PDR" />
          </Field>
        </Card>
        <Card>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Performance envelope</div>
          <Field label="Maximum characteristic dimension (m)" hint="Rotor-tip to rotor-tip (rotorcraft) or wingspan (fixed-wing)">
            <TInput value={ua.dim} onChange={v => set(p => ({ ...p, dim:v }))} placeholder="e.g. 1.2" type="number" step="0.1" min="0" />
          </Field>
          <Field label="Maximum speed (m/s)" hint="Maximum commanded airspeed as defined by designer">
            <TInput value={ua.speed} onChange={v => set(p => ({ ...p, speed:v }))} placeholder="e.g. 20" type="number" step="1" min="0" />
          </Field>
          <Field label="Maximum operating altitude (m AGL)" hint="Maximum flight geography height">
            <TInput value={ua.altitude} onChange={v => set(p => ({ ...p, altitude:v }))} placeholder="e.g. 120" type="number" step="10" min="0" />
          </Field>
          <Field label="Altitude measurement">
            <Radios value={ua.altMeasure || 'barometric'} onChange={v => set(p => ({ ...p, altMeasure:v }))}
              opts={[{ v:'barometric', l:'Barometric (±1 m)' }, { v:'gnss', l:'GNSS (±4 m)' }]} />
          </Field>
          <Field label="Target SAIL (override)" hint="Leave blank to auto-calculate in Phase 3">
            <SSelect value={ua.sailOverride || ''} onChange={v => set(p => ({ ...p, sailOverride:v }))}
              opts={[{ v:'', l:'Auto-calculate' }, ...['I','II','III','IV','V','VI'].map(s => ({ v:s, l:`SAIL ${s}` }))]} />
          </Field>
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Regulatory scope</div>
            {[{ v:'eu', l:'EU (EASA framework)' }, { v:'mil', l:'Military / NATO' }, { v:'intl', l:'International (FAA / CASA)' }].map(o => (
              <label key={o.v} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, marginBottom:6, cursor:'pointer' }}>
                <input type="checkbox" checked={(ua.scope || []).includes(o.v)}
                  onChange={e => {
                    const s = ua.scope || []
                    set(p => ({ ...p, scope: e.target.checked ? [...s, o.v] : s.filter(x => x !== o.v) }))
                  }} />
                {o.l}
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── PHASE 2 – Mission Parameters + CV/GRB ────────────────────────────────────
function Phase2({ ua, ms, setMs, setDerived }) {
  const [tab, setTab] = useState('mission')

  const V0 = fv(ua.speed), CD = fv(ua.dim), HFG = fv(ua.altitude) || 100
  const is250 = fv(ua.mtom) > 0 && fv(ua.mtom) <= 0.25 && V0 <= 25
  const dIdx = CD <= 1 ? 0 : CD <= 3 ? 1 : CD <= 8 ? 2 : CD <= 20 ? 3 : CD <= 40 ? 4 : -1
  const pIdx = POP_ROWS.findIndex(r => r.k === (ms.pop || '<500'))
  const iGRC = is250 ? 1 : (dIdx >= 0 && pIdx >= 0 ? (IGRC[dIdx]?.[pIdx] ?? null) : null)

  const pitch = fv(ms.pitch || '45') * Math.PI / 180
  const roll  = fv(ms.roll  || '30') * Math.PI / 180
  const S_R  = V0 * 1
  const S_CM = ua.type === 'fixed_wing'
    ? (V0*V0) / (G * Math.tan(roll  || 0.001))
    : (V0*V0) / (2 * G * Math.tan(pitch || 0.001))
  const S_CV = 7 + S_R + S_CM
  const H_AM = ua.altMeasure === 'gnss' ? 4 : 1
  const H_R  = V0 * 0.7
  const H_CM = ua.type === 'fixed_wing' ? ((V0*V0)/G)*0.3 : (V0*V0)/(2*G)
  const H_CV = HFG + H_AM + H_R + H_CM
  const S_GRB_1to1 = H_CV + 0.5*CD
  const S_GRB_ball = ua.type !== 'fixed_wing' ? V0*Math.sqrt(2*H_CV/G) + 0.5*CD : null
  const Vw = fv(ms.vwind || '5'), tP = fv(ms.tDeploy || '1.5'), Vz = fv(ms.vDescent || '5')
  const S_GRB_chute = V0*tP + Vw*(H_CV/Math.max(Vz, 0.1))
  const adjKm = Math.min(35, Math.max(5, V0*180/1000))

  useEffect(() => {
    setDerived(p => ({ ...p, iGRC, H_CV:rd(H_CV), S_CV:rd(S_CV) }))
  }, [iGRC, H_CV, S_CV])

  const TabBtn = ({ id, l }) => (
    <button onClick={() => setTab(id)} style={{
      padding:'8px 18px', fontSize:13, fontWeight:500, cursor:'pointer', border:'none',
      borderBottom: tab===id ? '2px solid var(--color-text-primary)' : '2px solid transparent',
      background:'transparent', marginBottom:-1,
      color: tab===id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    }}>{l}</button>
  )

  return (
    <div>
      <div style={{ display:'flex', borderBottom:'0.5px solid var(--color-border-tertiary)', marginBottom:16 }}>
        <TabBtn id="mission" l="Mission parameters" />
        <TabBtn id="cvgrb"   l="CV / GRB calculator" />
      </div>

      {tab === 'mission' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div>
            <Card style={{ marginBottom:16 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Ground risk — Step 2</div>
              <Field label="Maximum population density in iGRC footprint"
                hint="Use the highest density segment within the operational volume + ground risk buffer">
                <SSelect value={ms.pop || '<500'} onChange={v => setMs(p => ({ ...p, pop:v }))}
                  opts={POP_ROWS.map(r => ({ v:r.k, l:r.l }))} />
              </Field>
              {iGRC !== null && (
                <div style={{ padding:'9px 12px', background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', fontSize:13 }}>
                  <span style={{ color:'var(--color-text-secondary)' }}>Intrinsic GRC: </span>
                  <strong>{iGRC}</strong>
                  {is250 && <span style={{ fontSize:11, color:'var(--color-text-secondary)', marginLeft:8 }}>(auto — ≤250 g rule)</span>}
                </div>
              )}
              {iGRC === null && fv(ua.dim) > 0 && (
                <div style={{ padding:'8px 12px', background:'#fee2e2', borderRadius:'var(--border-radius-md)', fontSize:12, color:'#991b1b' }}>
                  UA characteristics outside SORA Table 2 — outside SORA scope
                </div>
              )}
            </Card>
            <Card>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Adjacent area — Step 8</div>
              <Field label="Adjacent area average population density">
                <SSelect value={ms.adjPop || 'no_limit'} onChange={v => setMs(p => ({ ...p, adjPop:v }))}
                  opts={[{ v:'no_limit', l:'No upper limit' }, { v:'<50000', l:'< 50,000 ppl/km²' }, { v:'<5000', l:'< 5,000 ppl/km²' }, { v:'<500', l:'< 500 ppl/km²' }, { v:'<50', l:'< 50 ppl/km²' }]} />
              </Field>
              <Field label="Outdoor assemblies within 1 km of operational volume">
                <SSelect value={ms.adjAsm || '<40k'} onChange={v => setMs(p => ({ ...p, adjAsm:v }))}
                  opts={[{ v:'>400k', l:'> 400,000 people' }, { v:'40k-400k', l:'40,000 – 400,000 people' }, { v:'<40k', l:'< 40,000 people' }]} />
              </Field>
              <div style={{ padding:'8px 12px', background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', fontSize:12, color:'var(--color-text-secondary)' }}>
                Adjacent area outer limit: <strong>{rd(adjKm, 1)} km</strong> {adjKm === 5 ? '(min 5 km)' : adjKm === 35 ? '(max 35 km)' : '(= V₀ × 180 s)'}
              </div>
            </Card>
          </div>
          <Card>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Air risk — Steps 4–5</div>
            <Field label="Airspace Encounter Category (AEC)" hint="Select the AEC that best matches your operational volume (Annex C / Figure 6)">
              <SSelect value={ms.aec || 'AEC9'} onChange={v => setMs(p => ({ ...p, aec:v }))}
                opts={AEC_LIST.map(a => ({ v:a.id, l:`${a.id} — ${a.d}` }))} />
            </Field>
            <Field label="Flight line-of-sight">
              <Radios value={ms.vlos || 'bvlos'} onChange={v => setMs(p => ({ ...p, vlos:v }))}
                opts={[{ v:'vlos', l:'VLOS / EVLOS (−1 ARC class)' }, { v:'bvlos', l:'BVLOS' }]} />
            </Field>
            <Field label="Additional strategic ARC mitigation (Annex C — optional)">
              <Radios value={ms.arcMit || 'none'} onChange={v => setMs(p => ({ ...p, arcMit:v }))}
                opts={[{ v:'none', l:'None' }, { v:'to_c', l:'Reduce to ARC-c' }, { v:'to_b', l:'Reduce to ARC-b' }]} />
            </Field>
          </Card>
        </div>
      )}

      {tab === 'cvgrb' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div>
            <Card>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>GRB calculation method — Annex A §5.2.4</div>
              <div style={{ marginBottom:12 }}>
                <Radios value={ms.grbMethod || 'ballistic'} onChange={v => setMs(p => ({ ...p, grbMethod:v }))}
                  opts={[{ v:'ballistic', l:'Ballistic (standard)' }, { v:'parachute', l:'Parachute fitted' }]} />
              </div>

              {(ms.grbMethod || 'ballistic') === 'parachute' && (
                <div style={{ padding:12, background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', marginBottom:12 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--color-text-secondary)', marginBottom:10 }}>
                    Parachute drift formula: S_GRB = V₀ · t_P + V_Wind · (H_CV / V_z)
                  </div>
                  <Field label="Time to open parachute — t_P (s)" hint="Deployment time from trigger to full inflation">
                    <TInput value={ms.tDeploy} onChange={v => setMs(p => ({ ...p, tDeploy:v }))} placeholder="e.g. 1.5" type="number" step="0.1" min="0" />
                  </Field>
                  <Field label="Rate of descent under parachute — V_z (m/s)" hint="Terminal descent rate with parachute fully deployed">
                    <TInput value={ms.vDescent} onChange={v => setMs(p => ({ ...p, vDescent:v }))} placeholder="e.g. 5.0" type="number" step="0.1" min="0.1" />
                  </Field>
                  <Field label="Maximum permissible wind speed — V_Wind (m/s)" hint="Minimum 3 m/s per Annex A §5.2.4. Values below 3 m/s are not considered realistic.">
                    <TInput value={ms.vwind} onChange={v => setMs(p => ({ ...p, vwind:v }))} placeholder="e.g. 5" type="number" step="0.5" min="3" />
                  </Field>
                  {Vw < 3 && (
                    <div style={{ fontSize:11, color:'#991b1b', marginTop:4 }}>
                      ⚠ Wind speed below 3 m/s — use a minimum of 3 m/s per Annex A §5.2.4
                    </div>
                  )}
                </div>
              )}

              {ua.type !== 'fixed_wing' && (ms.grbMethod || 'ballistic') === 'ballistic' && (
                <Field label="Max pitch angle Θ_max for stopping manoeuvre (°)" hint="≤45° assumed; enter measured value if available">
                  <TInput value={ms.pitch} onChange={v => setMs(p => ({ ...p, pitch:v }))} placeholder="45" type="number" step="5" min="5" />
                </Field>
              )}
              {ua.type === 'fixed_wing' && (
                <Field label="Max roll angle Φ_max for 180° turn (°)" hint="≤30° assumed">
                  <TInput value={ms.roll} onChange={v => setMs(p => ({ ...p, roll:v }))} placeholder="30" type="number" step="5" min="5" />
                </Field>
              )}
            </Card>
          </div>
          <div>
            <div style={{ background:'#dbeafe', borderRadius:'var(--border-radius-md)', padding:12, marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#1e40af', marginBottom:8 }}>Contingency Volume (CV) — Annex A §5.2.3</div>
              <GRow l="S_R (reaction distance)" v={rd(S_R)} u="m" n="= V₀ × 1 s" />
              <GRow l={ua.type === 'fixed_wing' ? 'S_CM (180° turn)' : 'S_CM (stopping manoeuvre)'} v={rd(S_CM)} u="m" />
              <GRow l="S_CV  horizontal" v={rd(S_CV)} u="m" n="= GNSS + Pos + K + S_R + S_CM" />
              <div style={{ borderTop:'0.5px solid #93c5fd', marginTop:8, paddingTop:8 }}>
                <GRow l="H_AM (altitude measurement error)" v={rd(H_AM)} u="m" n={ua.altMeasure === 'gnss' ? 'GNSS ±4 m' : 'Barometric ±1 m'} />
                <GRow l="H_R  (reaction height)" v={rd(H_R)} u="m" />
                <GRow l="H_CM (contingency manoeuvre height)" v={rd(H_CM)} u="m" />
                <GRow l="H_CV  vertical" v={rd(H_CV)} u="m" n="= H_FG + H_AM + H_R + H_CM" />
              </div>
            </div>

            <div style={{ background:'#fee2e2', borderRadius:'var(--border-radius-md)', padding:12, marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#991b1b', marginBottom:8 }}>Ground Risk Buffer (GRB) — Annex A §5.2.4</div>
              {(ms.grbMethod || 'ballistic') === 'ballistic' ? (
                <>
                  <GRow l="S_GRB  (1:1 simplified rule)" v={rd(S_GRB_1to1)} u="m" n="= H_CV + ½ CD" />
                  {S_GRB_ball !== null && <GRow l="S_GRB  (ballistic approach)" v={rd(S_GRB_ball)} u="m" n="= V₀√(2 H_CV / g) + ½ CD" />}
                  {ua.type !== 'fixed_wing' && (
                    <div style={{ fontSize:11, color:'#7f1d1d', marginTop:6 }}>
                      Use ballistic approach for a smaller, better-justified GRB. Ballistic is conservative for rotorcraft with power off.
                    </div>
                  )}
                  {ua.type === 'fixed_wing' && (
                    <div style={{ fontSize:11, color:'#7f1d1d', marginTop:6 }}>
                      Fixed-wing: S_GRB = glide_ratio × H_CV (power off). Provide glide ratio from designer performance data.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <GRow l="S_GRB  (parachute drift)" v={rd(S_GRB_chute)} u="m" n="= V₀ · t_P + V_Wind · (H_CV / V_z)" />
                  <div style={{ fontSize:11, color:'#7f1d1d', marginTop:6 }}>
                    Forward drift during deployment: {rd(V0*tP)} m. Wind-induced lateral drift during descent: {rd(Vw*(H_CV/Math.max(Vz, 0.1)))} m.
                    <br />Compare with 1:1 rule ({rd(S_GRB_1to1)} m) — use the larger value if parachute drift cannot be bounded.
                    <br /><strong>Note:</strong> If parachute is used as M2, this GRB replaces the ballistic value. Recalculate the final GRC in Phase 3.
                  </div>
                </>
              )}
            </div>

            <div style={{ background:'#f0fdf4', borderRadius:'var(--border-radius-md)', padding:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#15803d', marginBottom:8 }}>Adjacent area & VLOS limits</div>
              <GRow l="3-minute flyaway distance" v={rd(V0*180, 0)} u="m" n="= V₀ × 180 s" />
              <GRow l="Adjacent area outer limit" v={rd(adjKm, 1)} u="km" />
              <GRow l="VLOS limit at 5 km ground visibility" v={ua.type === 'fixed_wing' ? rd(490*CD+30, 0) : rd(327*CD+20, 0)} u="m" n="Annex A §5.2.5" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PHASE 3 – Mitigations & SAIL ────────────────────────────────────────────
const MIT_LIST = [
  {
    id:'m1a', code:'M1(A)', name:'Sheltering',
    credits:{ none:0, low:1, medium:2 }, avail:['none','low','medium'],
    note:'Low: no time-based restrictions. Medium: time-restricted flying (e.g. night, off-peak hours). CANNOT combine M1(A) medium with M1(B) at any level. UA must not penetrate structures (generally MTOM < 25 kg).',
  },
  {
    id:'m1b', code:'M1(B)', name:'Operational restrictions',
    credits:{ none:0, medium:1, high:2 }, avail:['none','medium','high'],
    note:'Space-time based restrictions (time of day, day of week, land-use characteristics). Applied pre-flight. Cannot combine with M1(A) medium.',
  },
  {
    id:'m1c', code:'M1(C)', name:'Ground observation',
    credits:{ none:0, low:1 }, avail:['none','low'],
    note:'Low robustness only (−1 GRC). Crew or system observes the vast majority of overflown areas and adjusts flight path in real time to avoid concentrations of people.',
  },
  {
    id:'m2', code:'M2', name:'Impact dynamics reduced',
    credits:{ none:0, medium:1, high:2 }, avail:['none','medium','high'],
    easa:{
      url:'https://www.easa.europa.eu/sites/default/files/dfu/Means_of_compliance_for_mitigation_means_M2_adopted.pdf',
      doc:'MOC Light-UAS.2512-01  (Published 6 July 2023)',
      types:[
        { t:'Type 1', d:'Critical area reduction: CAc must be ≤ the nominal critical area of the adjacent column to the left in SORA Table 2 (i.e. ~90% reduction in critical area).' },
        { t:'Type 2', d:'Lethality reduction: lethality ≤ 0.1 (10%). Typically achieved via parachute per ASTM F3322. An unguided parachute with ASTM F3322 is an accepted Type 2 path.' },
        { t:'Type 3', d:'Hybrid: lethality × CAc/CAn ≤ 0.1. Combination of area and lethality reductions.' },
      ],
      note:'Chapter 3 provides worked examples that may be used directly as MoC to the NAA. Designers applying to EASA for a DVR use Chapter 2. EASA DVR is required for M2 High robustness under the EASA framework.',
    },
    note:'No single failure may simultaneously cause loss of control AND loss of M2 effectiveness. UA ≤900 g MTOM and ≤19 m/s max speed automatically satisfies Medium assurance Criterion 1 (Annex B §B.5).',
  },
]

const CRC = { none:'var(--color-text-tertiary)', low:'#1e40af', medium:'#92400e', high:'#991b1b' }
const CBG = { none:'var(--color-background-secondary)', low:'#dbeafe', medium:'#fef3c7', high:'#fee2e2' }

function Phase3({ ua, ms, mits, setMits, derived, setDerived }) {
  const [expM2, setExpM2] = useState(false)

  const iGRC = derived.iGRC
  const finalGRC = iGRC !== null ? applyMit(iGRC, mits) : null
  const m1aMed = (mits.m1a || 'none') === 'medium'

  const aec = AEC_LIST.find(a => a.id === (ms.aec || 'AEC9'))
  let rARC = aec?.arc || null
  if (ms.vlos === 'vlos' && rARC && rARC !== 'a') {
    const ord = ['a','b','c','d']
    const i = ord.indexOf(rARC)
    if (i > 1) rARC = ord[i-1]
  }
  if (ms.arcMit === 'to_b' && rARC && rARC !== 'a') rARC = 'b'
  if (ms.arcMit === 'to_c' && rARC === 'd') rARC = 'c'

  const sail = finalGRC !== null && rARC ? getSAIL(finalGRC, rARC) : null
  const si = sail && sail !== 'CERT' ? (SAIL_IDX[sail] ?? null) : null
  const tmpr = { a:'None', b:'Low', c:'Medium', d:'High' }[rARC] || null
  const totalCredit = MIT_LIST.reduce((a, m) => a + (m.credits[mits[m.id] || 'none'] || 0), 0)

  useEffect(() => {
    setDerived(p => ({ ...p, finalGRC, residualARC:rARC, sail, tmpr, sailIdx:si }))
  }, [finalGRC, rARC, sail, tmpr, si])

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      {/* Mitigations */}
      <Card>
        <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>Ground risk mitigations — Step 3</div>
        <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:14 }}>
          iGRC: <strong>{iGRC ?? '—'}</strong> → Final GRC: <strong>{finalGRC ?? '—'}</strong>&nbsp;&nbsp;(total reduction: −{totalCredit}).
          Apply in numeric sequence per Annex B (JAR-doc-27).
        </div>
        {m1aMed && (
          <div style={{ padding:'8px 12px', background:'#fef3c7', borderRadius:'var(--border-radius-md)', fontSize:12, color:'#92400e', marginBottom:12 }}>
            M1(A) medium is selected — M1(B) is blocked at all levels (Annex B §B.2 double-counting prevention)
          </div>
        )}
        {MIT_LIST.map(mit => {
          const chosen = mits[mit.id] || 'none'
          const disabled = mit.id === 'm1b' && m1aMed
          return (
            <div key={mit.id} style={{ marginBottom:14, opacity:disabled ? 0.4 : 1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                <span>
                  <code style={{ fontSize:11, fontWeight:600, padding:'1px 6px', borderRadius:3, background:'#dbeafe', color:'#1e40af' }}>{mit.code}</code>
                  <span style={{ fontSize:12, fontWeight:600, marginLeft:8 }}>{mit.name}</span>
                </span>
                {(mit.credits[chosen] || 0) > 0 && (
                  <span style={{ fontSize:12, fontWeight:600, color:'#15803d' }}>−{mit.credits[chosen]} GRC</span>
                )}
              </div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:5 }}>
                {mit.avail.map(lv => (
                  <button key={lv} disabled={disabled} onClick={() => setMits(p => ({ ...p, [mit.id]:lv }))} style={{
                    padding:'4px 10px', fontSize:11, fontWeight:500, borderRadius:'var(--border-radius-md)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    border: chosen===lv ? `2px solid ${CRC[lv]}` : '0.5px solid var(--color-border-secondary)',
                    background: chosen===lv ? CBG[lv] : 'var(--color-background-primary)',
                    color: chosen===lv ? CRC[lv] : 'var(--color-text-secondary)',
                  }}>
                    {lv === 'none' ? 'Not applied' : lv.charAt(0).toUpperCase() + lv.slice(1)}
                    {(mit.credits[lv] || 0) > 0 ? ` (−${mit.credits[lv]} GRC)` : ''}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:11, color:'var(--color-text-secondary)', lineHeight:1.6 }}>{mit.note}</div>

              {/* M2 EASA MoC panel */}
              {mit.id === 'm2' && chosen !== 'none' && (
                <div style={{ marginTop:8 }}>
                  <button onClick={() => setExpM2(p => !p)} style={{
                    fontSize:11, padding:'3px 10px', border:'0.5px solid var(--color-border-secondary)',
                    borderRadius:'var(--border-radius-md)', cursor:'pointer',
                    background:'var(--color-background-primary)', color:'var(--color-text-primary)',
                  }}>
                    {expM2 ? '▲' : '▼'} EASA MoC Light-UAS.2512-01 — compliance pathways
                  </button>
                  {expM2 && (
                    <div style={{ marginTop:8, padding:12, background:'#f0fdf4', borderRadius:'var(--border-radius-md)', border:'0.5px solid #86efac' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:12, color:'#15803d' }}>{mit.easa.doc}</div>
                          <div style={{ fontSize:11, color:'#15803d' }}>Applies to all SAIL levels · Medium robustness (−1 GRC)</div>
                        </div>
                        <a href={mit.easa.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize:11, color:'#1d4ed8', whiteSpace:'nowrap' }}>Open EASA PDF ↗</a>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
                        {mit.easa.types.map(t => (
                          <div key={t.t} style={{ padding:'8px', background:'white', borderRadius:4, border:'0.5px solid #86efac' }}>
                            <div style={{ fontSize:11, fontWeight:600, color:'#15803d', marginBottom:3 }}>{t.t}</div>
                            <div style={{ fontSize:11, color:'#374151' }}>{t.d}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{mit.easa.note}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </Card>

      {/* Air risk + SAIL */}
      <div>
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>Air risk & TMPR — Steps 5–6</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:10 }}>
            {['a','b','c','d'].map(arc => (
              <div key={arc} style={{
                padding:'8px', borderRadius:'var(--border-radius-md)', textAlign:'center',
                background: rARC===arc ? {a:'#f3f4f6',b:'#dbeafe',c:'#fef3c7',d:'#fee2e2'}[arc] : 'var(--color-background-secondary)',
                border: rARC===arc ? `2px solid ${{a:'#6b7280',b:'#1e40af',c:'#92400e',d:'#991b1b'}[arc]}` : '0.5px solid var(--color-border-tertiary)',
              }}>
                <div style={{ fontSize:10, fontWeight:500, color:'var(--color-text-secondary)' }}>ARC-{arc.toUpperCase()}</div>
                <div style={{ fontSize:12, fontWeight:600, marginTop:2 }}>
                  {{a:'None',b:'Low',c:'Medium',d:'High'}[arc]}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:4 }}>
            Initial: <strong>ARC-{(aec?.arc || '?').toUpperCase()}</strong> ({ms.aec || 'AEC9'}) &rarr; Residual: <strong>ARC-{(rARC || '?').toUpperCase()}</strong>
          </div>
          <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>
            TMPR: <strong>{tmpr || '—'}</strong>
            {ms.vlos === 'bvlos' && tmpr && tmpr !== 'None' && ' · Must satisfy Detect, Decide, Command, Execute, Feedback loop per Annex D §5'}
            {ms.vlos === 'vlos' && ' · VLOS: document detection criteria, avoidance decision and phraseology for observers'}
          </div>
        </Card>

        <Card style={{ background: sail && sail !== 'CERT' ? SAIL_BG[(si||0)+1] : 'var(--color-background-primary)' }}>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:12,
            color: sail && sail !== 'CERT' ? SAIL_FG[(si||0)+1] : 'var(--color-text-primary)' }}>
            SAIL determination — Step 7 (Table 7)
          </div>
          {sail ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                {sail === 'CERT'
                  ? <span style={{ fontSize:16, fontWeight:600, color:'#991b1b' }}>Certified category required (GRC > 7)</span>
                  : <SailChip sail={sail} />
                }
                <span style={{ fontSize:13, color: sail !== 'CERT' ? SAIL_FG[(si||0)+1] : 'var(--color-text-secondary)' }}>
                  GRC {finalGRC} × ARC-{rARC?.toUpperCase()}
                </span>
              </div>
              {sail !== 'CERT' && si !== null && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                  {[['H','High','#fee2e2','#991b1b'], ['M','Medium','#fef3c7','#92400e'], ['L','Low','#dbeafe','#1e40af'], ['NR','NR','#f3f4f6','#9ca3af']].map(([k, label, bg, fg]) => {
                    const count = OSO_LIST.filter(o => {
                      const lv = o.lvl[si]
                      if (k === 'NR') return lv.startsWith('NR')
                      return lv.replace('*','') === k
                    }).length
                    return (
                      <div key={k} style={{ padding:'8px', borderRadius:'var(--border-radius-md)', background:bg, textAlign:'center' }}>
                        <div style={{ fontSize:10, color:fg, fontWeight:500 }}>{label}</div>
                        <div style={{ fontSize:18, fontWeight:600, color:fg }}>{count}</div>
                        <div style={{ fontSize:10, color:fg }}>OSOs</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize:13, color:'var(--color-text-secondary)' }}>
              Complete Phases 1–2 to derive SAIL automatically.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ─── PHASE 4 sub-tabs ─────────────────────────────────────────────────────────
function OSOTracker({ data, set, si, sail }) {
  const [exp, setExp] = useState(null)
  const [fScope, setFScope] = useState('All')
  const [fCat, setFCat] = useState('All')
  const idx = si ?? 0

  const filtered = OSO_LIST.filter(o =>
    (fScope === 'All' || o.sc === fScope) && (fCat === 'All' || o.cat === fCat)
  )
  const req  = OSO_LIST.filter(o => !o.lvl[idx].startsWith('NR')).length
  const done = OSO_LIST.filter(o => !o.lvl[idx].startsWith('NR') && ['declared','evidence','third_party'].includes(data[o.id]?.status)).length
  const pct = req > 0 ? Math.round(done/req*100) : 0
  const upd = (id, f, v) => set(p => ({ ...p, [id]:{ ...(p[id]||{}), [f]:v } }))
  const CC = { Ops:'#1d4ed8', Design:'#15803d', System:'#6d28d9', Crew:'#c2410c' }
  const FB = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      padding:'3px 10px', fontSize:11, fontWeight:500, borderRadius:'var(--border-radius-md)', cursor:'pointer',
      border:'0.5px solid var(--color-border-secondary)',
      background: active ? 'var(--color-text-primary)' : 'var(--color-background-primary)',
      color: active ? 'var(--color-background-primary)' : 'var(--color-text-primary)',
    }}>{children}</button>
  )

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {sail && <SailChip sail={sail} />}
          <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{done}/{req} OSOs with evidence · {pct}%</span>
        </div>
        <div style={{ width:140, height:5, borderRadius:3, background:'var(--color-background-secondary)', overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, height:'100%', background:pct===100?'#22c55e':'#3b82f6', borderRadius:3 }} />
        </div>
      </div>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 }}>
        {['All','Designer','Operator','Both'].map(s => <FB key={s} active={fScope===s} onClick={() => setFScope(s)}>{s}</FB>)}
        <span style={{ width:'0.5px', background:'var(--color-border-tertiary)', margin:'0 4px' }} />
        {['All','Ops','Design','System','Crew'].map(c => <FB key={c} active={fCat===c} onClick={() => setFCat(c)}>{c === 'All' ? 'All categories' : c}</FB>)}
      </div>
      <div style={{ border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', overflow:'hidden' }}>
        {filtered.map((o, i) => {
          const l = o.lvl[idx], isNR = l.startsWith('NR'), entry = data[o.id] || {}, st = entry.status || 'not_started', isExp = exp === o.id
          const lk = l.replace('*','')
          const moc = OSO_MOC[o.id]?.[lk] || OSO_MOC[o.id]?.L || OSO_MOC[o.id]?.M || []
          const c = CC[o.cat] || '#6b7280'
          return (
            <div key={o.id} style={{ borderBottom: i < filtered.length-1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
              <div onClick={() => setExp(isExp ? null : o.id)} style={{
                padding:'10px 14px', cursor:'pointer', opacity:isNR ? 0.5 : 1,
                background: isExp ? 'var(--color-background-secondary)' : 'var(--color-background-primary)',
                display:'grid', gridTemplateColumns:'70px 1fr 100px 44px 100px 22px', alignItems:'center', gap:8,
              }}>
                <code style={{ fontSize:11, fontWeight:600, padding:'2px 5px', borderRadius:3, color:c, background:`${c}18` }}>{o.id}</code>
                <div>
                  <div style={{ fontSize:12, fontWeight:500 }}>{o.s}</div>
                  <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{o.sc} · {o.cat}</div>
                </div>
                <StatusBadge st={st} />
                <LBadge l={l} />
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={entry.docRef || ''}>{entry.docRef || '—'}</div>
                <span style={{ color:'var(--color-text-tertiary)', fontSize:11 }}>{isExp ? '▲' : '▼'}</span>
              </div>
              {isExp && (
                <div style={{ padding:14, background:'var(--color-background-secondary)', borderTop:'0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, marginBottom:6 }}>Typical means of compliance at <LBadge l={l} /></div>
                      <ul style={{ margin:0, paddingLeft:18, fontSize:11, lineHeight:1.9, color:'var(--color-text-secondary)' }}>
                        {moc.map((m, mi) => <li key={mi}>{m}</li>)}
                      </ul>
                      {o.id === 'OSO#04' && !l.startsWith('NR') && (
                        <div style={{ marginTop:8, padding:'7px 10px', background:'#ede9fe', borderRadius:'var(--border-radius-md)', fontSize:11, color:'#5b21b6' }}>
                          → Use the <strong>OSO#04 ADS Matrix</strong> tab above for full requirement-level compliance tracking against all applicable ADS.
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, marginBottom:6 }}>Evidence tracker</div>
                      <div style={{ marginBottom:8 }}>
                        <StatusPicker value={st} onChange={v => upd(o.id, 'status', v)} keys={['not_started','in_progress','declared','evidence','third_party']} />
                      </div>
                      <DocField label="Document / evidence reference" value={entry.docRef} onChange={v => upd(o.id, 'docRef', v)} ph="e.g. FHA-001 Rev B,  OM §3.2" />
                      <DocField label="Owner / assigned to" value={entry.owner} onChange={v => upd(o.id, 'owner', v)} ph="e.g. Chief Engineer" />
                      <NotesField value={entry.notes} onChange={v => upd(o.id, 'notes', v)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MitTracker({ data, set }) {
  const [exp, setExp] = useState(null)
  const upd = (id, f, v) => set(p => ({ ...p, [id]:{ ...(p[id]||{}), [f]:v } }))
  return (
    <div>
      <p style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:14 }}>
        Track evidence for each ground risk mitigation applied in Phase 3. Full integrity and assurance criteria per Annex B (JAR-doc-27). M2 references EASA MOC Light-UAS.2512-01.
      </p>
      {MIT_LIST.map(mit => {
        const entry = data[mit.id] || {}, chosen = entry.level || 'none', isExp = exp === mit.id
        return (
          <div key={mit.id} style={{ border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', marginBottom:10, overflow:'hidden' }}>
            <div onClick={() => setExp(isExp ? null : mit.id)} style={{
              padding:'12px 14px', cursor:'pointer',
              background: isExp ? 'var(--color-background-secondary)' : 'var(--color-background-primary)',
              display:'grid', gridTemplateColumns:'60px 1fr 100px 80px 100px 22px', alignItems:'center', gap:10,
            }}>
              <code style={{ fontSize:12, fontWeight:600, padding:'2px 6px', borderRadius:4, background:'#dbeafe', color:'#1e40af' }}>{mit.code}</code>
              <div>
                <div style={{ fontSize:12, fontWeight:500 }}>{mit.name}</div>
                {mit.id === 'm2' && <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>EASA MOC Light-UAS.2512-01 applicable</div>}
              </div>
              <span style={{ display:'inline-block', padding:'2px 7px', fontSize:11, fontWeight:500, borderRadius:4, background:CBG[chosen], color:CRC[chosen] }}>
                {chosen === 'none' ? 'Not applied' : chosen.charAt(0).toUpperCase() + chosen.slice(1)}
              </span>
              <span style={{ fontSize:12, fontWeight:500, color:(mit.credits[chosen]||0)>0?'#15803d':'var(--color-text-tertiary)' }}>
                {(mit.credits[chosen]||0) > 0 ? `−${mit.credits[chosen]} GRC` : ''}
              </span>
              <StatusBadge st={entry.status || 'not_started'} />
              <span style={{ color:'var(--color-text-tertiary)', fontSize:11 }}>{isExp ? '▲' : '▼'}</span>
            </div>
            {isExp && (
              <div style={{ padding:14, background:'var(--color-background-secondary)', borderTop:'0.5px solid var(--color-border-tertiary)' }}>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:600, marginBottom:6 }}>Robustness level claimed</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {mit.avail.map(lv => (
                      <button key={lv} onClick={() => upd(mit.id, 'level', lv)} style={{
                        padding:'5px 12px', fontSize:11, fontWeight:500, borderRadius:'var(--border-radius-md)', cursor:'pointer',
                        border: chosen===lv ? `2px solid ${CRC[lv]}` : '0.5px solid var(--color-border-secondary)',
                        background: chosen===lv ? CBG[lv] : 'var(--color-background-primary)',
                        color: chosen===lv ? CRC[lv] : 'var(--color-text-secondary)',
                      }}>
                        {lv === 'none' ? 'Not applied' : lv.charAt(0).toUpperCase() + lv.slice(1)}
                        {(mit.credits[lv]||0) > 0 ? ` (−${mit.credits[lv]} GRC)` : ''}
                      </button>
                    ))}
                  </div>
                </div>
                {mit.id === 'm2' && chosen !== 'none' && (
                  <div style={{ marginBottom:12, padding:10, background:'#f0fdf4', borderRadius:'var(--border-radius-md)', border:'0.5px solid #86efac' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:'#15803d' }}>{mit.easa.doc}</span>
                      <a href={mit.easa.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:'#1d4ed8' }}>Open EASA PDF ↗</a>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
                      {mit.easa.types.map(t => (
                        <div key={t.t} style={{ padding:'8px', background:'white', borderRadius:4, border:'0.5px solid #86efac' }}>
                          <div style={{ fontSize:11, fontWeight:600, color:'#15803d', marginBottom:3 }}>{t.t}</div>
                          <div style={{ fontSize:11, color:'#374151' }}>{t.d}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{mit.easa.note}</div>
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <DocField label="Document / evidence reference" value={entry.docRef} onChange={v => upd(mit.id, 'docRef', v)} ph="e.g. Test report TRP-001" />
                    <DocField label="Owner / assigned to" value={entry.owner} onChange={v => upd(mit.id, 'owner', v)} ph="e.g. Safety Manager" />
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, marginBottom:5 }}>Evidence status</div>
                    <div style={{ marginBottom:8 }}>
                      <StatusPicker value={entry.status || 'not_started'} onChange={v => upd(mit.id, 'status', v)} keys={['not_started','in_progress','declared','evidence','third_party']} />
                    </div>
                    <NotesField value={entry.notes} onChange={v => upd(mit.id, 'notes', v)} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ADSMatrix({ data, set, sel, setSel, ua, si }) {
  const [fSub, setFSub] = useState('All')
  const [fCrit, setFCrit] = useState('all')
  const [exp, setExp] = useState(null)

  const suggested = {
    rotorcraft:  ['CS_LURS', 'SC_LightUAS'],
    fixed_wing:  ['CS_LUAS', 'SC_LightUAS', 'STANAG4671', 'ASTM_F3298'],
    vtol:        ['SC_VTOL', 'SC_LightUAS', 'CS_LURS', 'CS_LUAS'],
  }[ua.type] || []

  const upd = (reqId, adsId, f, v) => set(p => ({ ...p, [`${reqId}__${adsId}`]:{ ...(p[`${reqId}__${adsId}`]||{}), [f]:v } }))

  const allReqs = sel.flatMap(id => (ADS_REQS[id] || []).map(r => ({
    ...r, adsId:id, ads:ADS_LIST.find(a => a.id === id),
  })))
  const filtered = allReqs.filter(r =>
    (fSub === 'All' || r.sub === fSub) &&
    (fCrit === 'all' || r.crit === fCrit || (fCrit === 'major_up' && r.crit !== 'minor'))
  )
  const total = allReqs.length
  const done  = allReqs.filter(r => ['compliant','evidence','third_party'].includes(data[`${r.id}__${r.adsId}`]?.status)).length
  const pct   = total > 0 ? Math.round(done/total*100) : 0

  const critBg = { critical:'#fee2e2', major:'#fef3c7', minor:'#f3f4f6' }
  const critFg = { critical:'#991b1b', major:'#92400e', minor:'#9ca3af' }

  const FB = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      padding:'3px 9px', fontSize:11, fontWeight:500, borderRadius:'var(--border-radius-md)', cursor:'pointer',
      border:'0.5px solid var(--color-border-secondary)',
      background: active ? 'var(--color-text-primary)' : 'var(--color-background-primary)',
      color: active ? 'var(--color-background-primary)' : 'var(--color-text-primary)',
    }}>{children}</button>
  )

  return (
    <div>
      <p style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:12 }}>
        Select one or more Airworthiness Design Standards to track compliance at individual requirement level.
        Multiple ADS can be selected simultaneously for dual-qualification programmes (e.g. CS-LURS + STANAG 4671 for defence export).
        The matrix is available at all SAIL levels — OSO#04 is not required below SAIL IV, but voluntary ADS compliance tracking is always permitted.
      </p>
      <div style={{ padding:'8px 12px', background:'#ede9fe', borderRadius:'var(--border-radius-md)', fontSize:12, color:'#5b21b6', marginBottom:14 }}>
        OSO#04 safety objectives: SAIL IV → 10⁻⁴/FH LOC · SAIL V → 10⁻⁵/FH · SAIL VI → 10⁻⁶/FH.
        {si !== null && ` Current programme SAIL: SAIL ${['I','II','III','IV','V','VI'][si]}.`}
      </div>

      {/* ADS selection grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {ADS_LIST.map(ads => {
          const isSel = sel.includes(ads.id), isSug = suggested.includes(ads.id)
          return (
            <div key={ads.id} onClick={() => setSel(p => isSel ? p.filter(x => x !== ads.id) : [...p, ads.id])}
              style={{
                padding:'10px 12px', borderRadius:'var(--border-radius-md)', cursor:'pointer', position:'relative',
                border: isSel ? `2px solid ${ads.color}` : '0.5px solid var(--color-border-secondary)',
                background: isSel ? ads.bg : 'var(--color-background-primary)',
              }}>
              {isSug && !isSel && (
                <div style={{ position:'absolute', top:6, right:8, fontSize:9, padding:'1px 5px', borderRadius:3, background:'#dcfce7', color:'#15803d' }}>suggested</div>
              )}
              <div style={{ fontWeight:600, fontSize:12, color:isSel?ads.color:'var(--color-text-primary)', marginBottom:2 }}>{ads.name}</div>
              <div style={{ fontSize:10, color:isSel?ads.color:'var(--color-text-secondary)', lineHeight:1.4, marginBottom:3 }}>{ads.full}</div>
              <div style={{ fontSize:10, color:isSel?ads.color:'var(--color-text-tertiary)' }}>{ads.mtom} · {ads.version}</div>
              <div style={{ fontSize:9, fontStyle:'italic', marginTop:2, color:ads.access.includes('Public')?'#15803d':'#92400e' }}>{ads.access}</div>
              <a href={ads.url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ fontSize:10, color:'#1d4ed8', display:'inline-block', marginTop:4 }}>Open document ↗</a>
            </div>
          )
        })}
      </div>

      {sel.length === 0 && (
        <div style={{ padding:24, textAlign:'center', color:'var(--color-text-secondary)', fontSize:13 }}>
          Select one or more ADS above to load the compliance matrix.
        </div>
      )}

      {sel.length > 0 && (
        <>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, flexWrap:'wrap', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {sel.map(id => { const a = ADS_LIST.find(x => x.id===id); return <span key={id} style={{ fontSize:11, padding:'2px 7px', borderRadius:4, background:a?.bg, color:a?.color, fontWeight:500 }}>{a?.name}</span> })}
              <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{done}/{total} requirements addressed · {pct}%</span>
            </div>
            <div style={{ width:130, height:4, borderRadius:2, background:'var(--color-background-secondary)', overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', background:pct===100?'#22c55e':'#3b82f6', borderRadius:2 }} />
            </div>
          </div>

          {/* Filters */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
            {ADS_SUBS.map(s => <FB key={s} active={fSub===s} onClick={() => setFSub(s)}>{s}</FB>)}
            <span style={{ width:'0.5px', background:'var(--color-border-tertiary)', margin:'0 4px' }} />
            {[{v:'all',l:'All'},{v:'critical',l:'Critical only'},{v:'major_up',l:'Critical + Major'}].map(o => (
              <FB key={o.v} active={fCrit===o.v} onClick={() => setFCrit(o.v)}>{o.l}</FB>
            ))}
          </div>

          {/* Requirements table */}
          <div style={{ border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', overflow:'hidden' }}>
            {filtered.map((req, i) => {
              const key = `${req.id}__${req.adsId}`, entry = data[key] || {}, st = entry.status || 'not_started', isExp = exp === key
              return (
                <div key={key} style={{ borderBottom: i < filtered.length-1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                  <div onClick={() => setExp(isExp ? null : key)} style={{
                    padding:'9px 14px', cursor:'pointer',
                    background: isExp ? 'var(--color-background-secondary)' : 'var(--color-background-primary)',
                    display:'grid', gridTemplateColumns:'80px 46px 40px 1fr 100px 22px', alignItems:'center', gap:8,
                  }}>
                    <code style={{ fontSize:10, fontWeight:600, padding:'2px 4px', borderRadius:3, background:req.ads?.bg||'#f3f4f6', color:req.ads?.color||'#374151' }}>{req.id}</code>
                    <span style={{ fontSize:10, fontWeight:500, padding:'1px 5px', borderRadius:3, background:critBg[req.crit], color:critFg[req.crit], textAlign:'center' }}>{req.crit}</span>
                    <span style={{ fontSize:10, color:'var(--color-text-tertiary)' }}>{req.sub}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:500 }}>{req.title}</div>
                      <div style={{ fontSize:10, color:'var(--color-text-secondary)' }}>{req.ads?.name}</div>
                    </div>
                    <StatusBadge st={st} />
                    <span style={{ color:'var(--color-text-tertiary)', fontSize:11 }}>{isExp ? '▲' : '▼'}</span>
                  </div>
                  {isExp && (
                    <div style={{ padding:14, background:'var(--color-background-secondary)', borderTop:'0.5px solid var(--color-border-tertiary)' }}>
                      <p style={{ fontSize:12, margin:'0 0 12px', lineHeight:1.6 }}>{req.text}</p>
                      {req.text.includes('paywalled') && (
                        <div style={{ padding:'6px 10px', background:'#fef3c7', borderRadius:'var(--border-radius-md)', fontSize:11, color:'#92400e', marginBottom:10 }}>
                          Full requirement text requires purchase — see <a href={req.ads?.url} target="_blank" rel="noopener noreferrer">{req.ads?.name} ↗</a>
                        </div>
                      )}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, marginBottom:5 }}>Compliance status — {req.ads?.name}</div>
                          <StatusPicker value={st} onChange={v => upd(req.id, req.adsId, 'status', v)} keys={['not_started','in_progress','declared','evidence','third_party','compliant','na']} />
                        </div>
                        <div>
                          <DocField label="Document reference" value={entry.docRef} onChange={v => upd(req.id, req.adsId, 'docRef', v)} ph="e.g. Stress Report SR-001 §4.2" />
                          <DocField label="Owner / assigned to" value={entry.owner} onChange={v => upd(req.id, req.adsId, 'owner', v)} ph="e.g. Structures Lead" />
                          <NotesField value={entry.notes} onChange={v => upd(req.id, req.adsId, 'notes', v)} />
                        </div>
                      </div>
                      {/* Cross-ADS comparison for selected topic */}
                      {sel.length > 1 && (
                        <div style={{ marginTop:10 }}>
                          <div style={{ fontSize:11, fontWeight:600, marginBottom:6, color:'var(--color-text-secondary)' }}>Same sub-topic in other selected ADS:</div>
                          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            {sel.filter(id => id !== req.adsId).map(id => {
                              const other = ADS_LIST.find(a => a.id === id)
                              const match = (ADS_REQS[id] || []).find(r => r.sub === req.sub && r.crit === req.crit)
                              if (!match) return (
                                <span key={id} style={{ fontSize:11, padding:'4px 8px', borderRadius:4, background:other?.bg, color:other?.color }}>
                                  {other?.name}: no matching requirement in this sub-topic
                                </span>
                              )
                              const oe = data[`${match.id}__${id}`] || {}
                              return (
                                <div key={id} style={{ padding:'7px 10px', borderRadius:'var(--border-radius-md)', background:other?.bg, border:`0.5px solid ${other?.color}40`, fontSize:11 }}>
                                  <div style={{ fontWeight:600, color:other?.color, marginBottom:3 }}>{other?.name} — {match.id}: {match.title}</div>
                                  <StatusBadge st={oe.status || 'not_started'} />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function CSPExport({ derived, osoData, mitData, selADS, ua }) {
  const [show, setShow] = useState(false)
  const si = derived.sailIdx, sail = derived.sail
  const rows = si !== null ? OSO_LIST.map(o => ({ ...o, level:o.lvl[si], ...(osoData[o.id]||{}) })) : []
  const req  = rows.filter(o => !o.level?.startsWith('NR'))
  const done = req.filter(o => ['declared','evidence','third_party'].includes(o.status || ''))
  const date = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })

  const csv = [
    ['OSO ID','Objective','Level','Status','Document Reference','Owner','Notes'],
    ...rows.map(o => [o.id, o.s, o.level, ST_META[o.status||'not_started']?.l||'', o.docRef||'', o.owner||'', o.notes||'']),
  ].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')

  const dl = () => {
    const b = new Blob([csv], { type:'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b)
    a.download = `SORA_CSP_${(ua.name || 'UA').replace(/\s+/g, '_')}_${date.replace(/\s/g, '')}.csv`
    a.click()
  }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          ['UA / Project',   ua.name || '—'],
          ['Target SAIL',    sail ? `SAIL ${sail}` : '—'],
          ['OSO compliance', `${done.length}/${req.length} (${req.length>0 ? Math.round(done.length/req.length*100) : 0}%)`],
          ['Selected ADS',   selADS.map(id => ADS_LIST.find(a => a.id===id)?.name || id).join(', ') || 'None'],
        ].map(([l, v]) => (
          <div key={l} style={{ background:'var(--color-background-secondary)', borderRadius:'var(--border-radius-md)', padding:'10px 12px' }}>
            <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:2 }}>{l}</div>
            <div style={{ fontSize:13, fontWeight:600 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <button onClick={dl} style={{
          padding:'9px 20px', fontSize:13, fontWeight:500, borderRadius:'var(--border-radius-md)', cursor:'pointer',
          border:'0.5px solid var(--color-border-secondary)',
          background:'var(--color-background-primary)', color:'var(--color-text-primary)',
        }}>Download CSV compliance matrix</button>
        <button onClick={() => setShow(p => !p)} style={{
          padding:'9px 20px', fontSize:13, fontWeight:500, borderRadius:'var(--border-radius-md)', cursor:'pointer',
          border:'0.5px solid var(--color-border-secondary)',
          background:'var(--color-background-primary)', color:'var(--color-text-primary)',
        }}>{show ? 'Hide' : 'Preview'} CSP summary</button>
      </div>
      {show && (
        <div style={{ border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-lg)', padding:20 }}>
          <div style={{ fontSize:11, color:'var(--color-text-tertiary)', marginBottom:2, letterSpacing:'0.05em' }}>COMPREHENSIVE SAFETY PORTFOLIO · PHASE 2 COMPLIANCE MATRIX</div>
          <div style={{ fontSize:20, fontWeight:600, marginBottom:2 }}>{ua.name || '[UA designation]'}</div>
          <div style={{ fontSize:13, color:'var(--color-text-secondary)', marginBottom:14 }}>
            Generated {date} · {sail ? `SAIL ${sail}` : 'SAIL TBD'} · JARUS SORA v2.5 (JAR-doc-25) · Final GRC: {derived.finalGRC ?? '—'} · Residual ARC: {derived.residualARC ? `ARC-${derived.residualARC.toUpperCase()}` : '—'} · TMPR: {derived.tmpr || '—'}
          </div>
          <div style={{ border:'0.5px solid var(--color-border-tertiary)', borderRadius:'var(--border-radius-md)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, tableLayout:'fixed' }}>
              <colgroup>
                <col style={{ width:74 }} /><col />
                <col style={{ width:46 }} /><col style={{ width:110 }} /><col style={{ width:130 }} />
              </colgroup>
              <thead>
                <tr style={{ background:'var(--color-background-secondary)', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                  {['OSO','Objective','Level','Status','Document ref'].map(h => (
                    <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontWeight:600, fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((o, i) => (
                  <tr key={o.id} style={{
                    borderBottom:'0.5px solid var(--color-border-tertiary)',
                    opacity: o.level?.startsWith('NR') ? 0.4 : 1,
                    background: i%2===0 ? 'var(--color-background-primary)' : 'var(--color-background-secondary)',
                  }}>
                    <td style={{ padding:'7px 10px' }}><code style={{ fontSize:10, fontWeight:600 }}>{o.id}</code></td>
                    <td style={{ padding:'7px 8px' }}>{o.s}</td>
                    <td style={{ padding:'7px 8px' }}><LBadge l={o.level || 'NR'} /></td>
                    <td style={{ padding:'7px 8px' }}><StatusBadge st={o.status || 'not_started'} /></td>
                    <td style={{ padding:'7px 8px', fontSize:11, color:'var(--color-text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={o.docRef}>{o.docRef || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ua.manufacturer && <div style={{ marginTop:10, fontSize:12, color:'var(--color-text-secondary)' }}>Manufacturer: {ua.manufacturer}{ua.phase ? ` · Programme phase: ${ua.phase}` : ''}</div>}
        </div>
      )}
    </div>
  )
}

// ─── Phase 4 wrapper ──────────────────────────────────────────────────────────
function Phase4({ derived, osoData, setOsoData, mitData, setMitData, adsData, setAdsData, selADS, setSelADS, ua }) {
  const [sub, setSub] = useState('oso')
  const sail = derived.sail, si = derived.sailIdx

  const SubBtn = ({ id, l }) => (
    <button onClick={() => setSub(id)} style={{
      padding:'8px 18px', fontSize:12, fontWeight:500, cursor:'pointer', border:'none',
      borderBottom: sub===id ? '2px solid var(--color-text-primary)' : '2px solid transparent',
      background:'transparent', marginBottom:-1,
      color: sub===id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    }}>{l}</button>
  )

  return (
    <div>
      <div style={{ display:'flex', borderBottom:'0.5px solid var(--color-border-tertiary)', marginBottom:16, overflowX:'auto' }}>
        <SubBtn id="oso"  l="OSO tracker" />
        <SubBtn id="mit"  l="GRC mitigations" />
        <SubBtn id="oso4" l="OSO#04 ADS matrix" />
        <SubBtn id="csp"  l="CSP export" />
      </div>
      {sub === 'oso'  && <OSOTracker data={osoData} set={setOsoData} si={si} sail={sail} />}
      {sub === 'mit'  && <MitTracker data={mitData} set={setMitData} />}
      {sub === 'oso4' && <ADSMatrix  data={adsData} set={setAdsData} sel={selADS} setSel={setSelADS} ua={ua} si={si} />}
      {sub === 'csp'  && <CSPExport  derived={derived} osoData={osoData} mitData={mitData} selADS={selADS} ua={ua} />}
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
const PHASES = [
  { id:1, l:'UA definition' },
  { id:2, l:'Mission parameters' },
  { id:3, l:'Mitigations & SAIL' },
  { id:4, l:'Compliance' },
]

export default function App() {
  const [phase, setPhase] = useState(1)
  const [ua,    setUA]    = useState({ name:'', type:'rotorcraft', mtom:'', dim:'', speed:'', altitude:'100', altMeasure:'barometric', scope:[], manufacturer:'', phase:'', sailOverride:'' })
  const [ms,    setMs]    = useState({ pop:'<500', aec:'AEC9', vlos:'bvlos', arcMit:'none', adjPop:'no_limit', adjAsm:'<40k', grbMethod:'ballistic', vwind:'5', tDeploy:'1.5', vDescent:'5', pitch:'45', roll:'30' })
  const [mits,  setMits]  = useState({ m1a:'none', m1b:'none', m1c:'none', m2:'none' })
  const [derived, setDerived] = useState({ iGRC:null, finalGRC:null, residualARC:null, sail:null, tmpr:null, sailIdx:null })
  const [osoData,  setOsoData]  = useState({})
  const [mitData,  setMitData]  = useState({})
  const [adsData,  setAdsData]  = useState({})
  const [selADS,   setSelADS]   = useState([])

  // localStorage persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const d = JSON.parse(saved)
        if (d.ua)      setUA(d.ua)
        if (d.ms)      setMs(d.ms)
        if (d.mits)    setMits(d.mits)
        if (d.osoData) setOsoData(d.osoData)
        if (d.mitData) setMitData(d.mitData)
        if (d.adsData) setAdsData(d.adsData)
        if (d.selADS)  setSelADS(d.selADS)
      }
    } catch (e) { /* first run */ }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ua, ms, mits, osoData, mitData, adsData, selADS }))
      } catch (e) { /* storage full */ }
    }, 600)
    return () => clearTimeout(t)
  }, [ua, ms, mits, osoData, mitData, adsData, selADS])

  const wrapSet = useCallback(setter => updater => {
    setter(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (typeof next !== 'object' || Array.isArray(next)) return next
      const flat = {}
      Object.keys(next).forEach(k => { flat[k] = { ...(prev[k]||{}), ...(next[k]||{}) } })
      return flat
    })
  }, [])

  const sail = ua.sailOverride || derived.sail
  const si   = sail && sail !== 'CERT' ? (SAIL_IDX[sail] ?? null) : null
  const derivedFinal = { ...derived, sail, sailIdx:si }

  const phaseOK = [
    fv(ua.dim) > 0 && fv(ua.speed) > 0,
    derived.iGRC !== null,
    derived.sail  !== null,
    false,
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--color-text-secondary)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:3 }}>
            JARUS SORA v2.5 — UAV Certification Tool
          </div>
          <div style={{ fontSize:22, fontWeight:600, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            {ua.name || 'Unnamed UA'}
            {sail && sail !== 'CERT' && <SailChip sail={sail} />}
            {sail === 'CERT' && <span style={{ fontSize:14, fontWeight:600, color:'#991b1b' }}>Certified category</span>}
          </div>
          {(ua.manufacturer || ua.phase) && (
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:2 }}>
              {ua.manufacturer}{ua.phase ? ` · ${ua.phase}` : ''}
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {derived.finalGRC !== null && (
            <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>
              GRC {derived.finalGRC} · ARC-{derived.residualARC?.toUpperCase() || '?'}
            </span>
          )}
          <span style={{ fontSize:11, color:'var(--color-text-tertiary)' }}>Auto-saved</span>
        </div>
      </div>

      {/* Phase navigation */}
      <div style={{ display:'flex', marginBottom:'1.5rem', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
        {PHASES.map((p, i) => (
          <button key={p.id} onClick={() => setPhase(p.id)} style={{
            padding:'9px 20px', fontSize:13, fontWeight:500, cursor:'pointer', border:'none',
            borderBottom: phase===p.id ? '2px solid var(--color-text-primary)' : '2px solid transparent',
            background:'transparent', marginBottom:-1,
            color: phase===p.id ? 'var(--color-text-primary)' : phaseOK[i] ? '#15803d' : 'var(--color-text-secondary)',
            display:'flex', alignItems:'center', gap:7,
          }}>
            <span style={{
              width:20, height:20, borderRadius:'50%', fontSize:10, fontWeight:600,
              display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              background: phaseOK[i] ? '#15803d' : phase===p.id ? 'var(--color-text-primary)' : 'var(--color-background-secondary)',
              color: phaseOK[i] || phase===p.id ? '#fff' : 'var(--color-text-secondary)',
            }}>
              {phaseOK[i] ? '✓' : p.id}
            </span>
            {p.l}
          </button>
        ))}
      </div>

      {/* Phase content */}
      {phase === 1 && <Phase1 ua={ua} set={setUA} />}
      {phase === 2 && <Phase2 ua={ua} ms={ms} setMs={setMs} setDerived={setDerived} />}
      {phase === 3 && <Phase3 ua={ua} ms={ms} mits={mits} setMits={setMits} derived={derived} setDerived={setDerived} />}
      {phase === 4 && (
        <Phase4
          derived={derivedFinal}
          osoData={osoData}   setOsoData={wrapSet(setOsoData)}
          mitData={mitData}   setMitData={wrapSet(setMitData)}
          adsData={adsData}   setAdsData={setAdsData}
          selADS={selADS}     setSelADS={setSelADS}
          ua={ua}
        />
      )}

      {/* Footer nav */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2rem', paddingTop:'1rem', borderTop:'0.5px solid var(--color-border-tertiary)' }}>
        <button onClick={() => setPhase(p => Math.max(1, p-1))} disabled={phase===1} style={{
          padding:'9px 22px', fontSize:13, fontWeight:500, borderRadius:'var(--border-radius-md)',
          cursor: phase===1 ? 'not-allowed' : 'pointer',
          border:'0.5px solid var(--color-border-secondary)',
          background:'var(--color-background-primary)',
          color: phase===1 ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
        }}>← Previous</button>
        <span style={{ fontSize:12, color:'var(--color-text-secondary)', alignSelf:'center' }}>
          Phase {phase} of {PHASES.length}
        </span>
        <button onClick={() => setPhase(p => Math.min(4, p+1))} disabled={phase===4} style={{
          padding:'9px 22px', fontSize:13, fontWeight:500, borderRadius:'var(--border-radius-md)',
          cursor: phase===4 ? 'not-allowed' : 'pointer',
          border:'0.5px solid var(--color-border-secondary)',
          background:'var(--color-background-primary)',
          color: phase===4 ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
        }}>Next →</button>
      </div>
    </div>
  )
}
