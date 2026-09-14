export function generateTikZ(nodes, edges) {
  if (!nodes.length) return '% No nodes to export';

  // Calculate center to normalize around (0,0)
  const avgX = nodes.reduce((acc, n) => acc + n.position.x, 0) / nodes.length;
  const avgY = nodes.reduce((acc, n) => acc + n.position.y, 0) / nodes.length;

  const nodeMap = new Map();
  const rawNodeMap = new Map();

  nodes.forEach((node, i) => {
    const id = `node${i + 1}`;
    nodeMap.set(node.id, id);
    rawNodeMap.set(node.id, node);
  });

  const nodeDefinitions = nodes.map((node) => {
    const id = nodeMap.get(node.id);
    const x = ((node.position.x - avgX) / 45).toFixed(2);
    const y = (-(node.position.y - avgY) / 45).toFixed(2);

    const styleName = `bw ${node.data?.variant || 'definition'}`;
    const label = node.data?.label || '';

    return `  \\node[${styleName}] (${id}) at (${x}, ${y}) {${label}};`;
  }).join('\n');

  const edgeDefinitions = edges.map((edge) => {
    const sourceId = nodeMap.get(edge.source);
    const targetId = nodeMap.get(edge.target);
    const sourceNode = rawNodeMap.get(edge.source);
    const targetNode = rawNodeMap.get(edge.target);

    if (!sourceId || !targetId || !sourceNode || !targetNode) return '';

    const width = edge.data?.width || '1.0pt';
    const fontStyle = edge.data?.fontStyle || '\\scriptsize';
    const label = edge.data?.label
      ? ` node[midway, fill=white, inner sep=2pt] {${fontStyle} ${edge.data.label}}`
      : '';

    // Calculate exit and entry angles based on handle IDs or relative positions
    let outAngle = -90; // Default down
    let inAngle = 90;   // Default enter from top
    let srcAnchor = '';
    let tgtAnchor = '';

    if (edge.sourceHandle === 'right' || (!edge.sourceHandle && targetNode.position.x > sourceNode.position.x + 80)) {
      outAngle = 0;
      inAngle = 180;
      srcAnchor = '.east';
      tgtAnchor = '.west';
    } else if (edge.sourceHandle === 'left' || (!edge.sourceHandle && targetNode.position.x < sourceNode.position.x - 80)) {
      outAngle = 180;
      inAngle = 0;
      srcAnchor = '.west';
      tgtAnchor = '.east';
    } else if (edge.sourceHandle === 'top' || (!edge.sourceHandle && targetNode.position.y < sourceNode.position.y)) {
      outAngle = 90;
      inAngle = -90;
      srcAnchor = '.north';
      tgtAnchor = '.south';
    } else {
      outAngle = -90;
      inAngle = 90;
      srcAnchor = '.south';
      tgtAnchor = '.north';
    }

    // TikZ smooth Bézier curve matching React Flow
    return `  \\draw[line width=${width}] (${sourceId}${srcAnchor}) to[out=${outAngle}, in=${inAngle}]${label} (${targetId}${tgtAnchor});`;
  }).filter(Boolean).join('\n');

  return `\\documentclass[tikz,border=12pt]{standalone}
\\usepackage{amsmath,amssymb}
\\usetikzlibrary{shapes.geometric, positioning}

\\tikzset{
  bw root/.style={rectangle, rounded corners=14pt, fill=black, text=white, draw=black, line width=1.5pt, font=\\bfseries\\normalsize, align=center, inner sep=8pt, outer sep=2pt, text width=3.2cm},
  bw law/.style={rectangle, draw=black, line width=2.2pt, fill=white, text=black, font=\\bfseries\\small, align=center, inner sep=6pt, outer sep=2pt},
  bw theorem/.style={rectangle, draw=black, line width=1pt, double, double distance=1pt, fill=white, text=black, font=\\bfseries\\small, align=center, inner sep=6pt, outer sep=2pt},
  bw definition/.style={rectangle, rounded corners=3pt, draw=black, line width=1.2pt, fill=white, text=black, font=\\small, align=center, inner sep=6pt, outer sep=2pt},
  bw formula/.style={rectangle, rounded corners=2pt, draw=black, double, double distance=1.5pt, fill=white, text=black, font=\\small, align=center, inner sep=6pt, outer sep=2pt},
  bw axiom/.style={rectangle, dotted, draw=black, line width=1.2pt, fill=white, text=black, font=\\small, align=center, inner sep=5pt, outer sep=2pt},
  bw hypothesis/.style={rectangle, dashed, draw=black, line width=0.9pt, fill=white, text=black, font=\\itshape\\footnotesize, align=center, inner sep=5pt, outer sep=2pt},
  bw constant/.style={rectangle, rounded corners=8pt, draw=black, line width=0.8pt, fill=black!6, text=black, font=\\footnotesize, align=center, inner sep=4pt, outer sep=2pt}
}

\\begin{document}
\\begin{tikzpicture}
% Nodes
${nodeDefinitions}

% Curved Connecting Lines
${edgeDefinitions}
\\end{tikzpicture}
\\end{document}`;
}