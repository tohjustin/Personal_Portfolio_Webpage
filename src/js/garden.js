function defined(a, b) {
  return a != null ? a : b;
}

function Node(garden) {
  this.garden = garden;
  this.reset();
}

Node.prototype.reset = function (x, y, vx, vy, r) {
  this.x = defined(x, Math.random() * this.garden.width);
  this.y = defined(x, Math.random() * this.garden.height);
  this.vx = defined(vx, Math.random() * 0.5 - 0.25);
  this.vy = defined(vy, Math.random() * 0.5 - 0.25);
  this.r = defined(r, Math.random() * 2.5 + 1.1);
  this.speed = 20;
}

Node.prototype.getDiameter = function () {
  return this.r;
}

Node.prototype.squaredDistance = function (node) {
  return (node.x - this.x) * (node.x - this.x) + (node.y - this.y) * (node.y - this.y)
}

Node.prototype.addForce = function (force, direction) {
  this.vx += force * direction.x / this.r;
  this.vy += force * direction.y / this.r;
}

Node.prototype.distanceTo = function (node) {
  var x = node.x - this.x
  var y = node.y - this.y
  var total = Math.sqrt(Math.pow(x, this.speed) + Math.pow(y, this.speed))

  return { x: x, y: y, total: total }
}

Node.prototype.collideTo = function (node) {
  node.vx = node.r * node.vx / (this.r + node.r) + this.r * this.vx / (this.r + node.r);
  node.vy = node.r * node.vy / (this.r + node.r) + this.r * this.vy / (this.r + node.r);

  this.reset()
}


Node.prototype.update = function () {
  this.x += this.vx;
  this.y += this.vy;
  if (this.x > this.garden.width + 50 || this.x < -50 || this.y > this.garden.height + 50 || this.y < -50) {
    this.reset();
  }
}

Node.prototype.render = function () {
  this.garden.ctx.beginPath();
  this.garden.ctx.arc(this.x, this.y, this.getDiameter(), 0, 2 * Math.PI);
  this.garden.ctx.fill();
}

function Garden(container) {
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

Garden.prototype.start = function () {
  if (!this.playing) {
    this.playing = true;
    this.render(true);
  }
}

Garden.prototype.stop = function () {
  if (this.playing) {
    this.playing = false;
  }
}

Garden.prototype.resize = function () {
  this.width = this.container.offsetWidth;
  this.height = this.container.offsetHeight;
  this.area = this.width * this.height;
  this.nodes.length = Math.sqrt(this.area) / 15 | 0;

  this.canvas.width = this.width;
  this.canvas.height = this.height;
  this.ctx.fillStyle = '#FFF'

  for (var i = 0; i < this.nodes.length; i++) {
    if (!this.nodes[i]) {
      this.nodes[i] = new Node(this);
    }
  }
}

Garden.prototype.render = function (start) {
  var _this = this;
  if (!this.playing) {
    return
  }

  if (start) {
    requestAnimationFrame(function () {
      _this.render(true)
    })
  }

  this.ctx.clearRect(0, 0, this.width, this.height);

  var nodeA, nodeB;
  for (var i = 0; i < this.nodes.length - 1; i++) {
    nodeA = this.nodes[i]
    for (var j = i + 1; j < this.nodes.length; j++) {
      nodeB = this.nodes[j]
      var squaredDistance = nodeA.squaredDistance(nodeB);
      var force = 3 * (nodeA.r * nodeB.r) / squaredDistance;
      var opacity = force * 100;

      if (squaredDistance <= (nodeA.r / 2 + nodeB.r / 2) * (nodeA.r / 2 + nodeB.r / 2)) {
        if (nodeA.r <= nodeB.r) {
          nodeA.collideTo(nodeB)
        } else {
          nodeB.collideTo(nodeA)
        }
        continue
      }

      var distance = nodeA.distanceTo(nodeB);
      var direction = {
        x: distance.x / distance.total,
        y: distance.y / distance.total
      };

      this.ctx.beginPath();
      this.ctx.strokeStyle = 'rgba(191,191,191,' + (opacity < 1 ? opacity : 1) + ')';
      this.ctx.moveTo(nodeA.x, nodeA.y);
      this.ctx.lineTo(nodeB.x, nodeB.y);
      this.ctx.stroke();

      nodeA.addForce(force, direction);
      nodeB.addForce(-force, direction);
    }
  }

  for (var i = 0; i < this.nodes.length; i++) {
    this.nodes[i].render();
    this.nodes[i].update();
  }
}

export default Garden;
