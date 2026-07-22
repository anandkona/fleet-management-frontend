const fs = require('fs');

const extractChunk = (sourceFile, targetFile, startMarker, endMarker, type) => {
  const source = fs.readFileSync(sourceFile, 'utf8');
  let target = fs.readFileSync(targetFile, 'utf8');
  
  // Find start and end in source
  const startIdx = source.indexOf(startMarker);
  if (startIdx === -1) { console.log('start marker not found in ' + sourceFile); return; }
  
  const endIdx = source.indexOf(endMarker, startIdx);
  if (endIdx === -1) { console.log('end marker not found in ' + sourceFile); return; }
  
  // The chunk to insert
  let chunk = source.substring(startIdx + startMarker.length, endIdx + endMarker.length);
  
  // Adapt chunk if necessary
  if (type === 'repairs') {
    chunk = chunk.replace(/handleWorkflow/g, 'handleWorkflow'); 
    // Usually Mechanic pages use `handleWorkflow`, `hasPermission` is usually omitted or different.
    chunk = chunk.replace(/\{hasPermission\('repair_update'\)\s*&&\s*\(/g, '{(!t.status || t.status === \'DRAFT\' || t.status === \'OPEN\') && (');
  } else if (type === 'maintenance') {
    chunk = chunk.replace(/\{hasPermission\('maintenance_update'\)\s*&&\s*\(/g, '{(!t.status || t.status === \'DRAFT\' || t.status === \'OPEN\') && (');
  }
  
  // Remove the hasPermission imports or usages if adapted
  
  // Find where to inject in target
  // In MechanicRepairsPage.jsx: 
  // 197|             setForm({ ... images: [] }); 
  // 198|             setOpenDialog(true); 
  // 199|           }}); 
  // 200|                               setOpenDialog(true);
  
  // Target start marker
  const tStartMarker = "images: [] });\n            setOpenDialog(true);\n          }}";
  const tStartIdx = target.indexOf("images: [] });\n            setOpenDialog(true);\n          }}");
  if (tStartIdx === -1) { console.log('Target start not found in ' + targetFile); return; }
  
  const tEndMarker = "setOpenDialog(true);\n                            }} >";
  const tEndIdx = target.indexOf(tEndMarker, tStartIdx);
  if (tEndIdx === -1) { console.log('Target end not found in ' + targetFile); return; }
  
  // Let's replace the broken region with the adapted chunk
  target = target.substring(0, tStartIdx + tStartMarker.length) + chunk + target.substring(tEndIdx + "setOpenDialog(true);\n".length);
  
  fs.writeFileSync(targetFile, target);
  console.log('Recovered ' + targetFile);
};

// Start marker in source:
// repairs: images: [] }); setOpenDialog(true); }}
// maintenance: images: [] }); setOpenDialog(true); }}

extractChunk(
  'd:/fleet-management1/src/fleet/pages/RepairsPage.jsx', 
  'd:/fleet-management1/src/fleet/pages/MechanicRepairsPage.jsx',
  "images: [] });\n            setOpenDialog(true);\n          }}",
  "setOpenDialog(true);\n                            }}",
  'repairs'
);

extractChunk(
  'd:/fleet-management1/src/fleet/pages/MaintenancePage.jsx', 
  'd:/fleet-management1/src/fleet/pages/MechanicMaintenancePage.jsx',
  "images: [] });\n            setOpenDialog(true);\n          }}",
  "setOpenDialog(true);\n                            }}",
  'maintenance'
);
