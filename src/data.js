// App-owned ontology IDs are deliberately distinct from proprietary vendor IDs.
const concept = (id, name, aliases, domains, full = '', acronym = '') => ({ id: `ENG:${id}`, name, aliases: [name, ...aliases], domains, full, acronym });
export const SKILLS = [
  concept('solidworks','SOLIDWORKS',['Solid Works'],['aero','ev','uav','robotics']),
  concept('catia','CATIA',['CATIA V5','CATIA V6'],['aero','ev']),
  concept('nx','Siemens NX',['Unigraphics','NX'],['aero','ev']),
  concept('creo','PTC Creo',['Creo','Pro/ENGINEER'],['aero','ev']),
  concept('gdt','GD&T',['Geometric Dimensioning and Tolerancing','ASME Y14.5'],['aero','ev','robotics'],'Geometric Dimensioning and Tolerancing','GD&T'),
  concept('fea','FEA',['Finite Element Analysis'],['aero','ev','uav','robotics'],'Finite Element Analysis','FEA'),
  concept('ansys','ANSYS Mechanical',['ANSYS','ANSYS Workbench'],['aero','ev','uav','robotics']),
  concept('cfd','CFD',['Computational Fluid Dynamics'],['aero','ev','uav'],'Computational Fluid Dynamics','CFD'),
  concept('fluent','ANSYS Fluent',['Fluent'],['aero','ev','uav']),
  concept('abaqus','Abaqus',[],['aero','ev']),
  concept('nastran','MSC Nastran',['Nastran','Patran'],['aero']),
  concept('hypermesh','HyperMesh',[],['aero','ev']),
  concept('thermaldesktop','Thermal Desktop',[],['aero']),
  concept('propulsion','Propulsion Systems',['propulsion','rocket propulsion'],['aero','uav']),
  concept('cryogenic','Cryogenic Feed Systems',['cryogenic','cryogenic valves','feed systems'],['aero']),
  concept('cooling','Regenerative Cooling',['regenerative rocket nozzle'],['aero']),
  concept('orbital','Orbital Mechanics',[],['aero']),
  concept('cfrp','CFRP',['Carbon Fiber Reinforced Polymer','carbon fibre reinforced polymer','carbon-fiber','carbon fiber','composite structures','composite layup'],['aero','uav','ev'],'Carbon Fiber Reinforced Polymer','CFRP'),
  concept('modal','Modal Analysis',['modal','random vibration','structural dynamics'],['aero','ev','uav']),
  concept('thermostructural','Thermo-Structural Analysis',['thermo-structural'],['aero']),
  concept('dfm','DFM',['Design for Manufacturability','Design for Manufacturing'],['aero','ev','robotics'],'Design for Manufacturability','DFM'),
  concept('dfa','DFA',['Design for Assembly'],['aero','ev','robotics'],'Design for Assembly','DFA'),
  concept('as9100','AS9100',[],['aero']),
  concept('alias','Autodesk Alias',['Alias'],['ev']),
  concept('plm','PLM',['Product Lifecycle Management','Teamcenter','Windchill'],['ev','aero'],'Product Lifecycle Management','PLM'),
  concept('sheetmetal','Sheet Metal Design',['sheet metal'],['ev','robotics']),
  concept('injection','Injection Molding',['injection moulding','injection molding'],['ev']),
  concept('biw','BIW',['Body-in-White','Body in White'],['ev'],'Body-in-White','BIW'),
  concept('icepak','ANSYS Icepak',['Icepak'],['ev']),
  concept('star','Star-CCM+',['STAR CCM'],['ev']),
  concept('hyperworks','HyperWorks',['OptiStruct'],['ev']),
  concept('lsdyna','LS-DYNA',['LS DYNA'],['ev']),
  concept('mbd','MBD',['Multi-Body Dynamics','Multibody Dynamics','Adams Car'],['ev'],'Multi-Body Dynamics','MBD'),
  concept('matlab','MATLAB',['MATLAB/Simulink'],['ev','robotics','aero']),
  concept('simulink','Simulink',[],['ev','robotics']),
  concept('btms','BTMS',['Battery Thermal Management System','battery thermal management','battery pack thermal','thermal management'],['ev'],'Battery Thermal Management System','BTMS'),
  concept('bms','BMS',['Battery Management System'],['ev'],'Battery Management System','BMS'),
  concept('battery','Battery Pack Packaging',['battery packaging','battery pack','battery enclosure'],['ev']),
  concept('ip','Ingress Protection',['IP67','IP68'],['ev','robotics']),
  concept('dfmea','DFMEA',['Design Failure Mode and Effects Analysis'],['ev'],'Design Failure Mode and Effects Analysis','DFMEA'),
  concept('pfmea','PFMEA',['Process Failure Mode and Effects Analysis'],['ev'],'Process Failure Mode and Effects Analysis','PFMEA'),
  concept('apqp','APQP',['Advanced Product Quality Planning'],['ev'],'Advanced Product Quality Planning','APQP'),
  concept('ppap','PPAP',['Production Part Approval Process'],['ev'],'Production Part Approval Process','PPAP'),
  concept('ais','AIS-156',['AIS-038'],['ev']),
  concept('formula','Formula Student',['Formula Bharat','BAJA SAE','Supra SAE','Formula SAE','SAE BAJA'],['ev','aero','robotics']),
  concept('airframe','UAV Airframe Design',['airframe','UAV'],['uav']),
  concept('vtol','VTOL',['Vertical Take-Off and Landing','vertical takeoff and landing'],['uav'],'Vertical Take-Off and Landing','VTOL'),
  concept('aero','Aerodynamics',['fixed-wing','multirotor'],['uav','aero']),
  concept('vacuum','Vacuum Bagging',['autoclave'],['uav','aero']),
  concept('bldc','BLDC',['Brushless DC Motor','brushless direct current'],['uav'],'Brushless DC Motor','BLDC'),
  concept('thrust','Thrust-to-Weight Optimization',['propeller','thrust-to-weight'],['uav']),
  concept('landing','Landing Gear',['landing gear impact analysis'],['uav']),
  concept('vibration','Vibration Isolation',[],['uav','robotics']),
  concept('px4','PX4',[],['uav']),
  concept('ardupilot','ArduPilot',[],['uav']),
  concept('pixhawk','Pixhawk',['Pixhawk Flight Controller'],['uav']),
  concept('mavlink','MAVLink',[],['uav']),
  concept('mission','Mission Planner',['QGroundControl'],['uav']),
  concept('xflr','XFLR5',[],['uav']),
  concept('cfx','ANSYS CFX',['CFX'],['uav']),
  concept('gimbal','Payload Gimbal',['gimbal','payload packaging'],['uav']),
  concept('dgca','DGCA Type Certification',['DGCA'],['uav']),
  concept('kinematics','Kinematics',['Forward Kinematics','Inverse Kinematics'],['robotics']),
  concept('actuator','Actuator Sizing',['actuator','servo','stepper','harmonic drive','ball screw'],['robotics']),
  concept('gearbox','Gearbox Design',['planetary gearbox','gearbox sizing','gearbox'],['robotics','ev']),
  concept('eoat','EOAT',['End-of-Arm Tooling','End of Arm Tooling','gripper'],['robotics'],'End-of-Arm Tooling','EOAT'),
  concept('amr','AMR',['Autonomous Mobile Robot','mobile robot'],['robotics'],'Autonomous Mobile Robot','AMR'),
  concept('agv','AGV',['Automated Guided Vehicle'],['robotics'],'Automated Guided Vehicle','AGV'),
  concept('lidar','LiDAR',['Light Detection and Ranging'],['robotics'],'Light Detection and Ranging','LiDAR'),
  concept('ros','ROS 2',['ROS2','ROS','Robot Operating System'],['robotics'],'Robot Operating System','ROS 2'),
  concept('gazebo','Gazebo',[],['robotics']),
  concept('mujoco','MuJoCo',[],['robotics']),
  concept('isaac','Isaac Sim',[],['robotics']),
  concept('urdf','URDF',['Unified Robot Description Format'],['robotics'],'Unified Robot Description Format','URDF'),
  concept('python','Python',[],['robotics']),
  concept('cpp','C++',['C plus plus'],['robotics']),
  concept('altium','Altium',[],['robotics','uav']),
  concept('fos','FOS',['Factor of Safety'],['aero','ev','uav','robotics'],'Factor of Safety','FOS'),
];

export const PRESETS = {
  aero: {label:'Aerospace & SpaceTech',short:'Aerospace',title:'Mechanical Design Engineer',company:'an aerospace team',description:'Propulsion, structures & flight hardware',companies:'Skyroot · Agnikul · Bellatrix · Dhruva Space',tokens:['SOLIDWORKS','FEA','ANSYS Mechanical','GD&T','CFD'],jd:`Mechanical Design Engineer — Aerospace Propulsion & Structures\nEntry-level / 0–1 year | Bengaluru, Hyderabad or Chennai\n\nMinimum qualifications\n- B.E. / B.Tech in Mechanical or Aerospace Engineering; graduation in 2025 or 2026.\n- Hands-on SOLIDWORKS and ANSYS Mechanical experience in dated engineering projects or internships.\n- Finite Element Analysis (FEA) and Geometric Dimensioning and Tolerancing (GD&T).\n\nPreferred qualifications\n- Computational Fluid Dynamics (CFD) using ANSYS Fluent.\n- Propulsion systems, cryogenic feed systems, and regenerative cooling.\n- Formula Student or aerospace hardware competition experience.\n- Design for Manufacturability (DFM) and Carbon Fiber Reinforced Polymer (CFRP).\n\nApplication criteria\nImmediate availability; six months full-time for internships; willing to relocate.\nThis is an illustrative role brief, not an active vacancy.`},
  ev: {label:'EV, Automotive & Motorsport',short:'EV & Automotive',title:'Battery Packaging & Thermal Design Engineer',company:'an EV engineering team',description:'Battery systems, vehicle design & performance',companies:'Ather · Ultraviolette · River · Euler Motors',tokens:['SOLIDWORKS','BTMS','CFD','GD&T','DFMEA'],jd:`Battery Packaging & Thermal Design Engineer — Entry Level\nMinimum qualifications\n- B.Tech / B.E. in Mechanical or Automotive Engineering, 2025 or 2026 graduate.\n- SOLIDWORKS, battery pack packaging and Geometric Dimensioning and Tolerancing (GD&T).\n- Battery Thermal Management System (BTMS), Computational Fluid Dynamics (CFD) and ANSYS Fluent.\nPreferred qualifications\n- Design Failure Mode and Effects Analysis (DFMEA), Battery Management System (BMS), and IP67 ingress protection.\n- Formula Bharat / BAJA SAE hardware experience.\n- MATLAB / Simulink, APQP, PPAP and AIS-156.\nImmediate availability and willingness to relocate to Bengaluru or Pune.\nIllustrative role brief; not an active vacancy.`},
  uav: {label:'Drones & UAV',short:'Drones & UAV',title:'UAV Airframe & Composites Intern',company:'a UAV hardware team',description:'Airframes, composites & flight systems',companies:'IdeaForge · Garuda · Asteria · EndureAir',tokens:['SOLIDWORKS','CFRP','FEA','PX4','UAV Airframe Design'],jd:`UAV Airframe & Composites Intern\nMinimum qualifications\n- B.E. / B.Tech Mechanical or Aerospace Engineering, graduating 2025 or 2026.\n- SOLIDWORKS, UAV airframe design and Carbon Fiber Reinforced Polymer (CFRP).\n- Finite Element Analysis (FEA) with ANSYS Mechanical and landing gear impact analysis.\nPreferred qualifications\n- PX4, ArduPilot, Pixhawk and MAVLink integration.\n- Vertical Take-Off and Landing (VTOL), BLDC motor and propeller thrust-to-weight optimization.\n- Vacuum bagging, ANSYS Fluent, XFLR5 and DGCA type certification.\nSix months full-time availability and relocation to Bengaluru or NCR.\nIllustrative role brief; not an active vacancy.`},
  robotics: {label:'Robotics & Automation',short:'Robotics',title:'Robotics Mechanical Design Engineer',company:'a robotics engineering team',description:'Mechanisms, mechatronics & autonomous systems',companies:'Addverb · GreyOrange · Ati Motors · Unbox Robotics',tokens:['SOLIDWORKS','ROS 2','Kinematics','GD&T','AMR'],jd:`Robotics Mechanical Design Engineer — Graduate\nMinimum qualifications\n- B.E. / B.Tech Mechanical or Mechatronics Engineering, 2025 or 2026 graduate.\n- SOLIDWORKS, Geometric Dimensioning and Tolerancing (GD&T), gearbox design and actuator sizing.\n- Kinematics, Autonomous Mobile Robot (AMR) chassis design and Robot Operating System (ROS 2).\nPreferred qualifications\n- End-of-Arm Tooling (EOAT), Unified Robot Description Format (URDF), Gazebo and Python / C++.\n- MATLAB / Simulink, LiDAR packaging, sheet metal design and Finite Element Analysis (FEA).\nImmediate joining, six months full-time availability and willingness to relocate.\nIllustrative role brief; not an active vacancy.`}
};

const sampleProjects = {
 aero: `INTERNSHIPS\nOrbital Works — Mechanical Design Intern | Bengaluru, Karnataka | Jan 2026 – Jul 2026\n- Designed cryogenic feed systems in SOLIDWORKS with Geometric Dimensioning and Tolerancing (GD&T), reducing valve assembly mass by 18%.\n- Validated a propulsion systems bracket using Finite Element Analysis (FEA) in ANSYS Mechanical, achieving a Factor of Safety (FOS) of 1.85 under 4g load.\n- Simulated regenerative cooling nozzle channels using Computational Fluid Dynamics (CFD) in ANSYS Fluent, reducing pressure drop by 14 kPa.\n\nENGINEERING PROJECTS\nFormula Student Team — Structures Lead | Pune, Maharashtra | Aug 2025 – Dec 2025\n- Optimized a Carbon Fiber Reinforced Polymer (CFRP) monocoque in SOLIDWORKS using Design for Manufacturability (DFM), reducing frame mass by 4.2 kg.\n- Fabricated a propulsion systems test fixture in SOLIDWORKS, achieving a machining tolerance of 0.05 mm.`,
 ev: `INTERNSHIPS\nVolt Works — Battery Design Intern | Pune, Maharashtra | Jan 2026 – Jul 2026\n- Designed battery pack packaging in SOLIDWORKS with Geometric Dimensioning and Tolerancing (GD&T), reducing enclosure mass by 18%.\n- Simulated a Battery Thermal Management System (BTMS) cold plate using Computational Fluid Dynamics (CFD) in ANSYS Fluent, reducing peak cell temperature by 8 K.\n- Validated a Battery Management System (BMS) enclosure in SOLIDWORKS using Design Failure Mode and Effects Analysis (DFMEA), achieving IP67 ingress protection under 1 m submersion.\n\nENGINEERING PROJECTS\nFormula Bharat Team — Thermal Lead | Pune, Maharashtra | Aug 2025 – Dec 2025\n- Optimized battery pack cooling in MATLAB and Simulink, reducing cell temperature variation by 4 K.\n- Fabricated a battery pack bracket in SOLIDWORKS and documented Advanced Product Quality Planning (APQP), Production Part Approval Process (PPAP), and AIS-156 checks, reducing mass by 12%.`,
 uav: `INTERNSHIPS\nAero Works — UAV Airframe Intern | Bengaluru, Karnataka | Jan 2026 – Jul 2026\n- Designed a UAV airframe in SOLIDWORKS with Carbon Fiber Reinforced Polymer (CFRP) composite layup and vacuum bagging, reducing airframe mass by 18%.\n- Validated landing gear impact using Finite Element Analysis (FEA) in ANSYS Mechanical, achieving a Factor of Safety (FOS) of 1.9 under 4g load.\n- Integrated a PX4 and ArduPilot Pixhawk controller using MAVLink into a Vertical Take-Off and Landing (VTOL) airframe, increasing flight endurance by 12%.\n\nENGINEERING PROJECTS\nFlight Competition Team — Airframe Lead | Pune, Maharashtra | Aug 2025 – Dec 2025\n- Optimized a Brushless DC Motor (BLDC) propeller assembly with ANSYS Fluent and XFLR5, increasing thrust-to-weight by 15%.\n- Fabricated a landing gear fixture in SOLIDWORKS and documented DGCA type certification test evidence, achieving 0.1 mm tolerance.`,
 robotics: `INTERNSHIPS\nMotion Works — Robotics Design Intern | Pune, Maharashtra | Jan 2026 – Jul 2026\n- Designed an Autonomous Mobile Robot (AMR) chassis in SOLIDWORKS with Geometric Dimensioning and Tolerancing (GD&T), reducing chassis mass by 18%.\n- Validated planetary gearbox design and actuator sizing in MATLAB and Simulink using inverse kinematics, reducing actuator torque by 12 Nm.\n- Integrated Robot Operating System (ROS 2) and Unified Robot Description Format (URDF) for a chassis model in Gazebo using Python and C++, reducing simulation cycle time by 25%.\n\nENGINEERING PROJECTS\nRobocon Team — Mechanism Lead | Pune, Maharashtra | Aug 2025 – Dec 2025\n- Optimized End-of-Arm Tooling (EOAT) in SOLIDWORKS using Finite Element Analysis (FEA), reducing gripper mass by 220 g.\n- Fabricated a sheet metal LiDAR sensor bracket in SOLIDWORKS, achieving a positional tolerance of 0.05 mm.`
};

export function sampleResume(domain='aero', strong=true) {
  const p=PRESETS[domain];
  const skills=p.tokens.map(t=>{const s=SKILLS.find(s=>s.name===t);return s?.full?`${s.full} (${s.acronym})`:t;}).join(' · ');
  const header=`AARAV DESHMUKH\n${p.title} | ${p.tokens.join(' · ')}\nPune, Maharashtra | +91 9876543210 | aarav@example.com\nhttps://linkedin.com/in/aarav-demo | https://github.com/aarav-demo/engineering-portfolio`;
  if(!strong)return `${header.replace(p.title,'Mechanical Engineering Graduate')}\n\nEDUCATION\nPune Institute of Technology | B.Tech in Mechanical Engineering | Jun 2026\nCGPA: 8.6 / 10.0\n\nINTERNSHIPS\nEngineering Works — Design Intern | Pune | Summer 2025\n- Worked on mechanical design and assisted the team.\n- Used SOLIDWORKS to make parts.\n\nENGINEERING PROJECTS\nCollege Team — Team Member | Pune | 3rd Year\n- Helped build hardware.\n\nTECHNICAL SKILLS\n${p.tokens.join(', ')}, CATIA, ANSYS Fluent, DFM, CFRP, MATLAB\nSOLIDWORKS 85% | ANSYS 70%`;
  return `${header}\n\nSUMMARY\nMechanical engineering graduate with dated internship and competition hardware experience. ${p.description}.\n\nEDUCATION\nPune Institute of Technology | B.Tech in Mechanical Engineering | Jun 2026\nCGPA: 8.6 / 10.0\n\n${sampleProjects[domain]}\n\nTECHNICAL SKILLS\n${skills}\n\nCERTIFICATIONS\nEngineering design and hardware safety workshop | Feb 2026`;
}

export const DEFAULT_APPLICATION = {leverFastForwardEnabled:false,graduation:'2026',notice:'0',duration:'6',relocate:true,authorization:true,degree:true,compensation:'8',compensationType:'ctc',city:'Bengaluru',delay:'48',assessment:'80',assessmentThreshold:'75',maxNotice:'0',minDuration:'6',allowedYears:'2025, 2026',ctcMin:'4.5',ctcMax:'12',stipendMin:'15000',stipendMax:'40000'};
export const PLATFORM_NAMES=['Workday + HiredScore','Greenhouse','Lever','Ashby','Zoho Recruit','Workable','Darwinbox & Keka','Freshteam & Kula'];
export const SOURCES=[
 {title:'Workday: HiredScore grades',url:'https://stage.doc.workday.com/hiredscore/en-us/workday-hiredscore/recruiter-productivity-/concept--hiredscore-grades.html',note:'Grades prioritize review. Campus / graduate requisitions may not receive grades.'},
 {title:'Greenhouse: Application rules',url:'https://support.greenhouse.io/hc/en-us/articles/203105595-Application-rules-overview',note:'Recruiter-configured application rules can advance, tag or reject.'},
 {title:'Ashby: AI-assisted application review',url:'https://docs.ashbyhq.com/ai-assisted-application-review',note:'Criteria evaluation is separate from human reviewer scores.'},
 {title:'Workable: Auto-disqualifying questions',url:'https://help.workable.com/hc/en-us/articles/115012767067-Auto-disqualifying-questions',note:'Check the employer’s actual form configuration.'}
];
