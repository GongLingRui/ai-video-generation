import Dagre from '@dagrejs/dagre'
import type { AppNode, AppEdge } from '@/types'

const CONFIG_NODE_WIDTH = 320
const CONFIG_NODE_HEIGHT = 300
const VIDEO_NODE_WIDTH = 320
const VIDEO_NODE_HEIGHT = 240

function getNodeDimensions(node: AppNode) {
  if (node.type === 'video') {
    return { width: VIDEO_NODE_WIDTH, height: VIDEO_NODE_HEIGHT }
  }
  return { width: CONFIG_NODE_WIDTH, height: CONFIG_NODE_HEIGHT }
}

export function autoLayout(nodes: AppNode[], edges: AppEdge[]): AppNode[] {
  if (nodes.length === 0) return nodes

  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

  g.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 120,
    edgesep: 40,
    marginx: 50,
    marginy: 50,
  })

  for (const node of nodes) {
    const { width, height } = getNodeDimensions(node)
    g.setNode(node.id, { width, height })
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  Dagre.layout(g)

  return nodes.map((node) => {
    const dagreNode = g.node(node.id)
    if (!dagreNode) return node

    const { width, height } = getNodeDimensions(node)

    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2,
      },
    }
  })
}
