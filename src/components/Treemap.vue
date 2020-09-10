<template>
  <div class="treemap">
    <!-- The SVG structure is explicitly defined in the template with attributes derived from component data -->
    <svg :height="height" style="margin-left: 0px;" :width="width">
      <g style="shape-rendering: crispEdges;" transform="translate(0,20)">
        <!-- We can use Vue transitions too! -->
        <transition-group name="list" tag="g" class="depth">
          <!-- Generate each of the visible squares at a given zoom level (the current selected node) -->
          <g
            class="children"
            v-for="(children, index) in selectedNode._children"
            :key="'c_' + children.id"
            v-if="selectedNode"
            >

            <!-- Generate the children squares (only visible on hover of a square) -->
            <rect
              v-for="child in children._children"
              class="child"
              :id="child.id"
              :key="child.id"
              :height="y(child.y1) - y(child.y0)"
              :width="x(child.x1) - x(child.x0)"
              :x="x(child.x0)"
              :y="y(child.y0)"
              >
            </rect>

            <!--
              The visible square rect element.
              You can attribute directly an event, that fires a method that changes the current node,
              restructuring the data tree, that reactivly gets reflected in the template.
            -->
            <rect
              class="parent"
              v-on:click="selectNode"
              :id="children.id"
              :key="children.id"
              :x="x(children.x0)"
              :y="y(children.y0)"
              :width="x(children.x1 - children.x0 + children.parent.x0)"
              :height="y(children.y1 - children.y0 + children.parent.y0)"
              :style="{ fill: color(index) }"
              >

              <!-- The title attribute -->
              <title>{{ children.data.name }} | {{ children.value }}</title>
            </rect>

            <!-- The visible square text element with the title and value of the child node -->
            <text
              dy="1em"
              :key="'t_' + children.id"
              :x="x(children.x0) + 6"
              :y="y(children.y0) + 6"
              style="fill-opacity: 1;"
              >
              {{ children.data.name }}
            </text>

            <text
              dy="2.25em"
              :key="'t_' + children.id"
              :x="x(children.x0) + 6"
              :y="y(children.y0) + 6"
              style="fill-opacity: 1;"
              >

              {{ children.value }}
            </text>

          </g>
        </transition-group>

        <!-- The top most element, representing the previous node -->
        <g class="grandparent">

          <rect
            :height="margin.top"
            :width="width"
            :y="(margin.top * -1)"
            v-on:click="selectNode"
            :id="parentId">
          </rect>

          <!-- The visible square text element with the id (basically a breadcumb, if you will) -->
          <text
            dy=".65em"
            x="6"
            y="-14">

            {{ selectedNode.id }}
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script>
import {scaleLinear, scaleOrdinal} from 'd3-scale'
import {json} from 'd3-request'
import {hierarchy, treemap} from 'd3-hierarchy'

// To be explicit about which methods are from D3 let's wrap them around an object
// Is there a better way to do this?
let d3 = {
  scaleLinear: scaleLinear,
  scaleOrdinal: scaleOrdinal,
  json: json,
  hierarchy: hierarchy,
  treemap: treemap
}

export default {
  name: 'Treemap',
  // the component's data
  data () {
    return {
      jsonData: null,
      rootNode: {},
      margin: {
        top: 20,
        right: 0,
        bottom: 0,
        left: 0
      },
      width: 960,
      height: 530,
      selected: null,
      color: {}
    }
  },
  // You can do whatever when the selected node changes
  watch: {
    selectedNode (newData, oldData) {
      console.log('The selected node changed...')
    }
  },
  // In the beginning...
  mounted () {
    var that = this

    // An array with colors
    that.color = d3.scaleOrdinal([
      `#023fa5`, `#7d87b9`, `#bec1d4`, `#d6bcc0`, `#bb7784`, `#8e063b`, `#4a6fe3`, `#8595e1`,
      `#b5bbe3`, `#e6afb9`, `#e07b91`, `#d33f6a`, `#11c638`, `#8dd593`, `#c6dec7`, `#ead3c6`,
      `#f0b98d`, `#ef9708`, `#0fcfc0`, `#9cded6`, `#d5eae7`, `#f3e1eb`, `#f6c4e1`, `#f79cd4`
    ])

    // loads the data and calls the initialization methods
    d3.json('../static/flare.json',
      function (error, data) {
        if (error) console.log(error)
        that.jsonData = data
        that.initialize()
        that.accumulate(that.rootNode, that)
        that.treemap(that.rootNode)
      }
    )
  },
  // The reactive computed variables that fire rerenders
  computed: {
    // The grandparent id
    parentId () {
      if (this.selectedNode.parent === undefined || this.selectedNode.parent === null) {
        return this.selectedNode.id
      } else {
        return this.selectedNode.parent.id
      }
    },
    // Returns the x position within the current domain
    // Maybe it can be replaced by a vuejs method
    x () {
      return d3.scaleLinear()
        .domain([0, this.width])
        .range([0, this.width])
    },
    // Returns the y position within the current domain
    // Maybe it can be replaced by a vuejs method
    y () {
      return d3.scaleLinear()
        .domain([0, this.height - this.margin.top - this.margin.bottom])
        .range([0, this.height - this.margin.top - this.margin.bottom])
    },
    // The D3 function that recursively subdivides an area into rectangles
    treemap () {
      return d3.treemap()
        .size([this.width, this.height])
        .round(false)
        .paddingInner(0)
    },
    // The current selected node
    selectedNode () {
      let node = null

      if (this.selected) {
        let nd = this.getNodeById(this.rootNode, this.selected, this)

        if (nd._children) {
          node = nd
        } else {
          node = nd.parent
        }
      } else {
        node = this.rootNode
      }

      // Recalculates the y and x domains
      this.x.domain([node.x0, node.x0 + (node.x1 - node.x0)])
      this.y.domain([node.y0, node.y0 + (node.y1 - node.y0)])

      return node
    }
  },
  methods: {
    // Called once, to create the hierarchical data representation
    initialize () {
      let that = this

      if (that.jsonData) {
        that.rootNode = d3.hierarchy(that.jsonData)
          .eachBefore(function (d) { d.id = (d.parent ? d.parent.id + '.' : '') + d.data.name })
          .sum((d) => d.value)
          .sort(function (a, b) {
            return b.height - a.height || b.value - a.value
          })
        that.rootNode.x = that.rootNode.y = 0
        that.rootNode.x1 = that.width
        that.rootNode.y1 = that.height
        that.rootNode.depth = 0
      }
    },
    // Calculates the accumulated value (sum of children values) of a node - its weight,
    // represented afterwards in the area of its square
    accumulate (d, context) {
      d._children = d.children

      if (d._children) {
        d.value = d._children.reduce(function (p, v) { return p + context.accumulate(v, context) }, 0)
        return d.value
      } else {
        return d.value
      }
    },
    // Helper method - gets a node by its id attribute
    getNodeById (node, id, context) {
      if (node.id === id) {
        return node
      } else if (node._children) {
        for (var i = 0; i < node._children.length; i++) {
          var nd = context.getNodeById(node._children[i], id, context)
          if (nd) {
            return nd
          }
        }
      }
    },
    // When a user clicks a square, changes the selected data attribute
    // which fires the computed selectedNode, which in turn finds the Node by the id of the square clicked
    // and the template reflects the changes
    selectNode (event) {
      this.selected = event.target.id
    }
  }
}
</script>

<style scoped>

text {
  pointer-events: none;
}

.grandparent text {
  font-weight: bold;
}

rect {
  fill: none;
  stroke: #fff;
}

rect.parent,
.grandparent rect {
  stroke-width: 2px;
}

.grandparent rect {
  fill: orange;
}

.grandparent:hover rect {
  fill: #ee9700;
}

.children rect.parent,
.grandparent rect {
  cursor: pointer;
}

.children rect.parent {
  fill: #bbb;
  fill-opacity: .5;
}

.children:hover rect.child {
  fill: #bbb;
}

.children text{
  font-size: 0.8em;
}

.grandparent text{
  font-size: 0.9em;
}

.list-enter-active, .list-leave-active {
  transition: all 1s;
}
.list-enter, .list-leave-to /* .list-leave-active for <2.1.8 */ {
  opacity: 0;
}

</style>
