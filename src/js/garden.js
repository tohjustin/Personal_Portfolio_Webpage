const INITIAL_VELOCITY = 0.5;
const NODE_SIZE_VARIATION = 2;
const NODE_SIZE_MIN = 1;
const PARTICLE_DENSITY_COEFFICIENT = 15; // lower value = more particles
const PARTICLE_FILL_COLOR = '#fff';
const PARTICLE_STROKE_COLOR = '#bfbfbf';

function hexToRgba(hexValue, opacityValue = 1) {
  const opacity = Math.min(opacityValue, 1);
  const hex = hexValue.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r},${g},${b},${opacity})`;
}

class Node {
  constructor(gardenInstance) {
    this.garden = gardenInstance;
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.garden.width;
    this.y = Math.random() * this.garden.height;
    this.vx = (Math.random() * INITIAL_VELOCITY) - (INITIAL_VELOCITY / 2);
    this.vy = (Math.random() * INITIAL_VELOCITY) - (INITIAL_VELOCITY / 2);
    this.r = (Math.random() * NODE_SIZE_VARIATION) + NODE_SIZE_MIN;
    this.speed = Math.sqrt((this.vx ** 2) + (this.vy ** 2));
  }

  squaredDistance(node) {
    return ((node.x - this.x) ** 2) + ((node.y - this.y) ** 2);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x > this.garden.width + 50
      || this.x < -50
      || this.y > this.garden.height + 50
      || this.y < -50) {
      this.reset();
    }
  }

  render() {
    this.garden.ctx.beginPath();
    this.garden.ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    this.garden.ctx.fill();
  }
}

class Garden {
  constructor(container) {
    this.nodes = [];
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.started = false;
    this.playing = false;
    this.canvas.id = 'garden';
    this.resize();
    this.container.appendChild(this.canvas);
  }

  static computeStrokeStyle(nodeA, nodeB) {
    const squaredDistance = nodeA.squaredDistance(nodeB);
    const force = (3 * nodeA.r * nodeB.r) / squaredDistance;
    return hexToRgba(PARTICLE_STROKE_COLOR, force * 100);
  }

  start() {
    if (!this.playing) {
      this.playing = true;
      this.render(true);
    }
  }

  stop() {
    if (this.playing) {
      this.playing = false;
    }
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.area = this.width * this.height;
    this.nodes.length = Math.trunc(Math.sqrt(this.area) / PARTICLE_DENSITY_COEFFICIENT);

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.fillStyle = PARTICLE_FILL_COLOR;

    for (let i = 0; i < this.nodes.length; i += 1) {
      if (!this.nodes[i]) {
        const gardenInstance = this;
        this.nodes[i] = new Node(gardenInstance);
      }
    }
  }

  render(start) {
    if (!this.playing) {
      return;
    }

    if (start) {
      requestAnimationFrame(() => {
        this.render(true);
      });
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render lines between particles
    for (let i = 0; i < this.nodes.length - 1; i += 1) {
      const nodeA = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j += 1) {
        const nodeB = this.nodes[j];

        this.ctx.beginPath();
        this.ctx.strokeStyle = Garden.computeStrokeStyle(nodeA, nodeB);
        this.ctx.moveTo(nodeA.x, nodeA.y);
        this.ctx.lineTo(nodeB.x, nodeB.y);
        this.ctx.stroke();
      }
    }

    // Render particles
    for (let k = 0; k < this.nodes.length; k += 1) {
      this.nodes[k].render();
      this.nodes[k].update();
    }
  }
}

export default Garden;
