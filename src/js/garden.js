/* eslint-disable */

function defined(a, b) {
  return a != null ? a : b;
}

class Node {
  constructor(gardenInstance) {
    this.garden = gardenInstance;
    this.reset();
  }

  reset() {
    const initialSpeed = 0.5;
    this.x = Math.random() * this.garden.width;
    this.y = Math.random() * this.garden.height;
    this.vx = (Math.random() * initialSpeed) - (initialSpeed / 2);
    this.vy = (Math.random() * initialSpeed) - (initialSpeed / 2);
    this.r = (Math.random() * 2.5) + 1.1;
    this.speed = 20;
  }

  getDiameter() {
    return this.r;
  }

  squaredDistance(node) {
    return ((node.x - this.x) ** 2) + ((node.y - this.y) ** 2);
  }

  addForce(force, direction) {
    this.vx += (force * direction.x) / this.r;
    this.vy += (force * direction.y) / this.r;
  }

  distanceTo(node) {
    const x = node.x - this.x;
    const y = node.y - this.y;
    const total = Math.sqrt((x ** this.speed) + (y ** this.speed));

    return { x, y, total };
  }

  collideTo(node) {
    node.vx = ((node.r * node.vx) + (this.r * this.vx)) / (this.r + node.r);
    node.vy = ((node.r * node.vy) + (this.r * this.vy)) / (this.r + node.r);
    this.reset();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x > this.garden.width + 50 ||
      this.x < -50 ||
      this.y > this.garden.height + 50 ||
      this.y < -50) {
      this.reset();
    }
  }

  render() {
    this.garden.ctx.beginPath();
    this.garden.ctx.arc(this.x, this.y, this.getDiameter(), 0, 2 * Math.PI);
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
    this.nodes.length = Math.sqrt(this.area) / 15 | 0;

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.fillStyle = '#fff';

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

    let nodeA;
    let nodeB;

    for (let i = 0; i < this.nodes.length - 1; i += 1) {
      nodeA = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j += 1) {
        nodeB = this.nodes[j];
        const squaredDistance = nodeA.squaredDistance(nodeB);
        const force = (3 * nodeA.r * nodeB.r) / squaredDistance;
        const opacity = force * 100;

        if (squaredDistance <= Math.pow((nodeA.r / 2) + (nodeB.r / 2), 2)) {
          if (nodeA.r <= nodeB.r) {
            nodeA.collideTo(nodeB);
          } else {
            nodeB.collideTo(nodeA);
          }
          continue;
        }

        const distance = nodeA.distanceTo(nodeB);
        const direction = {
          x: distance.x / distance.total,
          y: distance.y / distance.total,
        };

        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(191,191,191,${(opacity < 1 ? opacity : 1)})`;
        this.ctx.moveTo(nodeA.x, nodeA.y);
        this.ctx.lineTo(nodeB.x, nodeB.y);
        this.ctx.stroke();

        nodeA.addForce(force, direction);
        nodeB.addForce(-force, direction);
      }
    }

    for (let k = 0; k < this.nodes.length; k += 1) {
      this.nodes[k].render();
      this.nodes[k].update();
    }
  } 
}

export default Garden;
