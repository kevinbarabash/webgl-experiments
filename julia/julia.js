document.body.style.margin = 0;

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

const gl = canvas.getContext('experimental-webgl');

const program = createProgram('julia');

const w = window.innerWidth;
const h = window.innerHeight;

var mouse = [0, 0];
var left, right, bottom, _top;
var dw, dh;

const size = 3;

if (canvas.width > canvas.height) {
    dh = 3 / canvas.height;
    dw = dh;

    left = -size / 2 * canvas.width / canvas.height;
    right = size / 2 * canvas.width / canvas.height;
    bottom = -size / 2;
    _top = size / 2;
} else {
    dw = 3 / canvas.width;
    dh = dw;

    left = -size / 2;
    right = size / 2;
    bottom = -size / 2 * canvas.height / canvas.width;
    _top = size / 2 * canvas.height / canvas.width;
}

const bounds = new Float32Array([left, bottom, right, bottom, right, _top, left, _top]);


class Complex {
    constructor(re, im) {
        Object.assign(this, { re, im });
    }

    get arg() {
        return Math.atan2(this.im, this.re);
    }

    set arg(val) {
        const mod = this.mod;
        this.re = Math.cos(val) * mod;
        this.im = Math.sin(val) * mod;
    }

    get mod() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }

    set mod(val) {
        const scale = val / this.mod;
        this.re *= scale;
        this.im *= scale;
    }
}

const c = new Complex(0.13, 0.71);

program.buffers.pos = createBuffer(gl.ARRAY_BUFFER, new Float32Array([0, 0, w, 0, w, h, 0, h]), gl.STATIC_DRAW);
program.buffers.uv = createBuffer(gl.ARRAY_BUFFER, bounds, gl.STATIC_DRAW);
program.buffers.elements = createBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 3]), gl.STATIC_DRAW);


gl.clearColor(0.5, 0.5, 0.5, 1);
gl.viewport(0, 0, w, h);

var dragging = false;

const draw = function() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    program.useProgram();

    const projMatrix = ortho([], 0, w, 0, h, -1, 1);
    gl.uniformMatrix4fv(program.uniforms.projMatrix, false, projMatrix);
    gl.uniform2fv(program.uniforms.c, [c.re, c.im]);

    // set up vertex attributes before drawing
    program.buffers.pos.bind();
    program.attributes.pos.pointer(2, gl.FLOAT, false, 0, 0);

    program.buffers.uv.bind();

    program.buffers.uv.update(bounds);
    program.attributes.uv.pointer(2, gl.FLOAT, false, 0, 0);

    program.buffers.elements.bind();
    gl.drawElements(gl.TRIANGLE_FAN, 4, gl.UNSIGNED_SHORT, 0);

    gl.flush();

    if (dragging) {
        requestAnimationFrame(draw);
    }
};

requestAnimationFrame(draw);

var lastMouse;

document.addEventListener('mousedown', function(e) {
    lastMouse = [e.pageX, h - e.pageY];
    dragging = true;
    requestAnimationFrame(draw);
});

document.addEventListener('mousemove', function(e) {
    if (dragging) {
        mouse = [e.pageX, h - e.pageY];
        const dx = mouse[0] - lastMouse[0];
        const dy = mouse[1] - lastMouse[1];
        bounds[0] -= dx * dw * scale;
        bounds[2] -= dx * dw * scale;
        bounds[4] -= dx * dw * scale;
        bounds[6] -= dx * dw * scale;
        bounds[1] -= dy * dh * scale;
        bounds[3] -= dy * dh * scale;
        bounds[5] -= dy * dh * scale;
        bounds[7] -= dy * dh * scale;
        lastMouse = mouse;
    }
});

document.addEventListener('mouseup', function(e) {
    if (dragging) {
        dragging = false;
        mouse = [e.pageX, h - e.pageY];
        const dx = mouse[0] - lastMouse[0];
        const dy = mouse[1] - lastMouse[1];
        bounds[0] -= dx * dw * scale;
        bounds[2] -= dx * dw * scale;
        bounds[4] -= dx * dw * scale;
        bounds[6] -= dx * dw * scale;
        bounds[1] -= dy * dh * scale;
        bounds[3] -= dy * dh * scale;
        bounds[5] -= dy * dh * scale;
        bounds[7] -= dy * dh * scale;
        lastMouse = mouse;
    }
});

document.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    lastMouse = [touch.pageX, h - touch.pageY];
    dragging = true;
    requestAnimationFrame(draw);
});

document.addEventListener('touchmove', function(e) {
    if (dragging) {
        const touch = e.changedTouches[0];
        mouse = [touch.pageX, h - touch.pageY];
        const dx = mouse[0] - lastMouse[0];
        const dy = mouse[1] - lastMouse[1];
        bounds[0] -= dx * dw * scale;
        bounds[2] -= dx * dw * scale;
        bounds[4] -= dx * dw * scale;
        bounds[6] -= dx * dw * scale;
        bounds[1] -= dy * dh * scale;
        bounds[3] -= dy * dh * scale;
        bounds[5] -= dy * dh * scale;
        bounds[7] -= dy * dh * scale;
        lastMouse = mouse;
    }
});

document.addEventListener('touchend', function(e) {
    if (dragging) {
        dragging = false;
        const touch = e.changedTouches[0];
        mouse = [touch.pageX, h - touch.pageY];
        const dx = mouse[0] - lastMouse[0];
        const dy = mouse[1] - lastMouse[1];
        bounds[0] -= dx * dw * scale;
        bounds[2] -= dx * dw * scale;
        bounds[4] -= dx * dw * scale;
        bounds[6] -= dx * dw * scale;
        bounds[1] -= dy * dh * scale;
        bounds[3] -= dy * dh * scale;
        bounds[5] -= dy * dh * scale;
        bounds[7] -= dy * dh * scale;
        lastMouse = mouse;
    }
});

var scale = 1;

document.addEventListener('wheel', function(e) {
    if (e.wheelDelta === 0) {
        return;
    }

    var dscale = Math.log(Math.abs(e.wheelDelta)) / Math.log(3);
    dscale = Math.pow(dscale, 0.03);

    if (e.wheelDelta > 0) {
        scale /= dscale;
    } else {
        scale *= dscale;
    }

    var left = bounds[0];
    var right = bounds[2];
    var bottom = bounds[1];
    var _top = bounds[5];

    var width = right - left;
    var height = _top - bottom;

    if (e.wheelDelta > 0) {
        width /= dscale;
        height /= dscale;
    } else {
        width *= dscale;
        height *= dscale;
    }

    var cx = (left + right) / 2;
    var cy = (bottom + _top) / 2;

    left = cx - width / 2;
    right = cx + width / 2;
    bottom = cy - height / 2;
    _top = cy + height / 2;

    bounds[0] = left;
    bounds[1] = bottom;
    bounds[2] = right;
    bounds[3] = bottom;
    bounds[4] = right;
    bounds[5] = _top;
    bounds[6] = left;
    bounds[7] = _top;

    requestAnimationFrame(draw);

    e.preventDefault();
});

var gui = new dat.GUI();

gui.add(c, 're', -2, 2);
gui.add(c, 'im', -2, 2);
gui.add(c, 'mod', 0.1, 2.0).step(0.01);
gui.add(c, 'arg', -Math.PI, Math.PI).step(0.01);