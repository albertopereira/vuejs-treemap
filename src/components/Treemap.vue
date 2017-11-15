<template>
  <div class="treemap">
    <svg :height="height" style="margin-left: 0px;" :width="width">
      <g style="shape-rendering: crispEdges;" transform="translate(0,20)">
        <transition-group name="list" tag="g" class="depth">
          <g class="children" v-for="(children, index) in selectedNode._children" :key="'c_' + children.id" v-if="selectedNode">

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
              
              <title>{{ child.name }} | {{ child.value }}</title>
            </rect>

            <rect 
              class="parent" 
              v-on:click.prevent="selectNode" 
              :id="children.id" 
              :key="children.id" 
              :x="x(children.x0)" 
              :y="y(children.y0)" 
              :width="x(children.x1 - children.x0 + children.parent.x0)" 
              :height="y(children.y1 - children.y0 + children.parent.y0)" 
              :style="{ fill: color(index) }"
              >
              
              <title>{{ children.data.name }} | {{ children.value }}</title>
            </rect>

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

        <g class="grandparent">
          
          <rect 
            :height="margin.top" 
            :width="width" 
            :y="(margin.top * -1)" 
            v-on:click="selectNode" 
            :id="parentId">
          </rect>

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
import * as d3 from 'd3'

export default {
  name: 'Treemap',
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
      formatNumber: d3.format(',d'),
      selected: null,
      color: {}
    }
  },
  watch: {
    selectedNode (newData, oldData) {
      console.log(oldData)
    }
  },
  mounted () {
    var that = this
    that.color = d3.scaleOrdinal(d3.schemeCategory20)

    d3.json('../static/flare.json',
      function (error, data) {
        if (error) throw error
        that.jsonData = data
        that.initialize()
        that.accumulate(that.rootNode, that)
        that.treemap(that.rootNode)
      }
    )
  },
  computed: {
    parentId () {
      if (this.selectedNode.parent === undefined || this.selectedNode.parent === null) {
        return this.selectedNode.id
      } else {
        return this.selectedNode.parent.id
      }
    },
    x () {
      return d3.scaleLinear()
        .domain([0, this.width])
        .range([0, this.width])
    },
    y () {
      return d3.scaleLinear()
        .domain([0, this.height - this.margin.top - this.margin.bottom])
        .range([0, this.height - this.margin.top - this.margin.bottom])
    },
    computedHeight () {
      return 500 - this.margin.top - this.margin.bottom
    },
    treemap () {
      return d3.treemap()
      .size([this.width, this.height])
      .round(false)
      .paddingInner(1)
    },
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

      this.x.domain([node.x0, node.x0 + (node.x1 - node.x0)])
      this.y.domain([node.y0, node.y0 + (node.y1 - node.y0)])

      return node
    }
  },
  methods: {
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
    accumulate (d, context) {
      d._children = d.children

      if (d._children) {
        d.value = d._children.reduce(function (p, v) { return p + context.accumulate(v, context) }, 0)
        return d.value
      } else {
        return d.value
      }
    },
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
