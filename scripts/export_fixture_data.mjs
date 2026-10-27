import {PRESETS,sampleResume} from '../src/data.js';
const samples=Object.fromEntries(Object.keys(PRESETS).map(domain=>[domain,{strong:sampleResume(domain,true),weak:sampleResume(domain,false)}]));
process.stdout.write(JSON.stringify(samples));
