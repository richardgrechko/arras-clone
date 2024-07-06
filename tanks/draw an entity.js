// no fucking dmca please
const drawPolyImgs = [];
function drawPoly(context, centerX, centerY, radius, sides, angle = 0, borderless, fill, imageInterpolation) {
    // Start drawing
    context.beginPath();
    if (sides instanceof Array) {
        let dx = Math.cos(angle);
        let dy = Math.sin(angle);
        for (let [x, y] of sides)
            context.lineTo(
                centerX + radius * (x * dx - y * dy),
                centerY + radius * (y * dx + x * dy)
            );
    } else {
        if ("string" === typeof sides) {
            //ideally we'd preload images when mockups are loaded but im too lazy for that atm
            if (!drawPolyImgs[sides]) {
                drawPolyImgs[sides] = new Image();
                drawPolyImgs[sides].src = sides;
                drawPolyImgs[sides].isBroken = false;
                drawPolyImgs[sides].onerror = function() {
                    this.isBroken = true;
                };
            }
            let img = drawPolyImgs[sides];
            if (img.isBroken || !img.complete) { // check if img is broken and draw as path2d if so
                let path = new Path2D(sides);
                context.save();
                context.translate(centerX, centerY);
                context.scale(radius, radius);
                context.lineWidth /= radius;
                context.rotate(angle);
                context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
                if (!borderless) context.stroke(path);
                if (fill) context.fill(path);
                context.restore();
                return;
            }
            context.translate(centerX, centerY);
            context.rotate(angle);
            context.imageSmoothingEnabled = imageInterpolation;
            context.drawImage(img, -radius, -radius, radius*2, radius*2);
            context.imageSmoothingEnabled = true;
            context.rotate(-angle);
            context.translate(-centerX, -centerY);
            return;
        }
        angle += sides % 2 ? 0 : Math.PI / sides;
    }
    if (!sides) {
        // Circle
        let fillcolor = context.fillStyle;
        let strokecolor = context.strokeStyle;
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        context.fillStyle = strokecolor;
        context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
        if (!borderless) context.stroke();
        context.closePath();
        context.beginPath();
        context.fillStyle = fillcolor;
        context.arc(centerX, centerY, radius * fill, 0, 2 * Math.PI);
        if (fill) context.fill();
        context.closePath();
        return;
    } else if (sides < 0) {
        // Star
        if (settings.graphical.pointy) context.lineJoin = "miter";
        sides = -sides;
        angle += (sides % 1) * Math.PI * 2;
        sides = Math.floor(sides);
        let dip = 1 - 6 / (sides ** 2);
        context.moveTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
        context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
        for (let i = 0; i < sides; i++) {
            let htheta = ((i + 0.5) / sides) * 2 * Math.PI + angle,
                theta = ((i + 1) / sides) * 2 * Math.PI + angle,
                cx = centerX + radius * dip * Math.cos(htheta),
                cy = centerY + radius * dip * Math.sin(htheta),
                px = centerX + radius * Math.cos(theta),
                py = centerY + radius * Math.sin(theta);
            /*if (curvyTraps) {
                context.quadraticCurveTo(cx, cy, px, py);
            } else {
                context.lineTo(cx, cy);
                context.lineTo(px, py);
            }*/
            context.quadraticCurveTo(cx, cy, px, py);
        }
    } else if (sides > 0) {
        // Polygon
        angle += (sides % 1) * Math.PI * 2;
        sides = Math.floor(sides);
        context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
        for (let i = 0; i < sides; i++) {
            let theta = (i / sides) * 2 * Math.PI + angle;
            context.lineTo(centerX + radius * Math.cos(theta), centerY + radius * Math.sin(theta));
        }
    }
    context.closePath();
    if (!borderless) context.stroke();
    if (fill) context.fill();
    context.lineJoin = "round";
}
function drawTrapezoid(context, x, y, length, height, aspect, angle, borderless, fill, alpha, strokeWidth, position) {
    let h = [];
    h = aspect > 0 ? [height * aspect, height] : [height, -height * aspect];

    // Construct a trapezoid at angle 0
    let points = [],
        sinT = Math.sin(angle),
        cosT = Math.cos(angle);
    points.push([-position, h[1]]);
    points.push([length * 2 - position, h[0]]);
    points.push([length * 2 - position, -h[0]]);
    points.push([-position, -h[1]]);
    context.globalAlpha = alpha;
    
    // Rotate it to the new angle via vector rotation
    context.beginPath();
    for (let point of points) {
        let newX = point[0] * cosT - point[1] * sinT + x,
            newY = point[0] * sinT + point[1] * cosT + y;
        context.lineTo(newX, newY);
    }
    context.closePath();
    context.lineWidth *= strokeWidth
    context.lineWidth *= fill ? 1 : 0.5; // Maintain constant border width
    if (!borderless) context.stroke();
    context.lineWidth /= fill ? 1 : 0.5; // Maintain constant border width
    if (fill) context.fill();
    context.globalAlpha = 1;
}
const drawEntity = (baseColor, x, y, instance, ratio, alpha = 1, scale = 1, lineWidthMult = 1, rot = 0, turretsObeyRot = false, assignedContext = false, turretInfo = false, render = instance.render) => {
    let context = assignedContext ? assignedContext : ctx;
    let fade = turretInfo ? 1 : render.status.getFade(),
        drawSize = scale * ratio * instance.size,
        indexes = instance.index.split("-"),
        m = global.mockups[parseInt(indexes[0])],
        xx = x,
        yy = y,
        source = turretInfo === false ? instance : turretInfo,
        blend = render.status.getBlend(),
        initStrokeWidth = lineWidthMult * Math.max(settings.graphical.mininumBorderChunk, ratio * settings.graphical.borderChunk);
    source.guns.update();
    if (fade === 0 || alpha === 0) return;
    if (render.expandsWithDeath) drawSize *= 1 + 0.5 * (1 - fade);
    if (settings.graphical.fancyAnimations && assignedContext != ctx2 && (fade !== 1 || alpha !== 1)) {
        context = ctx2;
        context.canvas.width = context.canvas.height = drawSize * m.position.axis / ratio * 2 + initStrokeWidth;
        xx = context.canvas.width / 2 - (drawSize * m.position.axis * m.position.middle.x * Math.cos(rot)) / 4;
        yy = context.canvas.height / 2 - (drawSize * m.position.axis * m.position.middle.y * Math.sin(rot)) / 4;
    } else {
        if (fade * alpha < 0.5) return;
    }
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = initStrokeWidth

    let upperTurretsIndex = source.turrets.length;
    // Draw turrets beneath us
    for (let i = 0; i < source.turrets.length; i++) {
        let t = source.turrets[i];
        context.lineWidth = initStrokeWidth * t.strokeWidth
        t.lerpedFacing == undefined
            ? (t.lerpedFacing = t.facing)
            : (t.lerpedFacing = util.lerpAngle(t.lerpedFacing, t.facing, 0.1, true));
        
        // Break condition
        if (t.layer > 0) {
            upperTurretsIndex = i;
            break;
        }

        let ang = t.direction + t.angle + rot,
            len = t.offset * drawSize,
            facing;
        if (t.mirrorMasterAngle || turretsObeyRot) {
            facing = rot + t.angle;
        } else {
            facing = t.lerpedFacing;
        }
        drawEntity(baseColor, xx + len * Math.cos(ang), yy + len * Math.sin(ang), t, ratio, 1, (drawSize / ratio / t.size) * t.sizeFactor, lineWidthMult, facing, turretsObeyRot, context, t, render);
    }
    // Draw guns below us
    let positions = source.guns.getPositions(),
        gunConfig = source.guns.getConfig();
    for (let i = 0; i < source.guns.length; i++) {
        context.lineWidth = initStrokeWidth
        let g = gunConfig[i];
        if (!g.drawAbove) {
            let gx = g.offset * Math.cos(g.direction + g.angle + rot),
                gy = g.offset * Math.sin(g.direction + g.angle + rot),
                gunColor = g.color == null ? color.grey : gameDraw.modifyColor(g.color, baseColor),
                alpha = g.alpha,
                strokeWidth = g.strokeWidth,
                borderless = g.borderless,
                fill = g.drawFill;
            gameDraw.setColor(context, gameDraw.mixColors(gunColor, render.status.getColor(), blend));
            drawTrapezoid(context, xx + drawSize * gx, yy + drawSize * gy, drawSize * g.length / 2, drawSize * g.width / 2, g.aspect, g.angle + rot, borderless, fill, alpha, strokeWidth, drawSize * positions[i]);
        }
    }
    // Draw body
    context.globalAlpha = 1;
    context.lineWidth = initStrokeWidth * m.strokeWidth
    gameDraw.setColor(context, gameDraw.mixColors(gameDraw.modifyColor(instance.color, baseColor), render.status.getColor(), blend));
    
    //just so you know, the glow implimentation is REALLY bad and subject to change in the future
    context.shadowColor = m.glow.color!=null ? gameDraw.modifyColor(m.glow.color) : gameDraw.mixColors(
        gameDraw.modifyColor(instance.color),
        render.status.getColor(),
        render.status.getBlend()
    );
    if (m.glow.radius && m.glow.radius>0){
      context.shadowBlur = m.glow.radius * ((drawSize / m.size) * m.realSize);
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.globalAlpha = m.glow.alpha;
      for (var i = 0; i < m.glow.recursion; i++) {
        drawPoly(context, xx, yy, (drawSize / m.size) * m.realSize, m.shape, rot, true, m.drawFill);
      }
      context.globalAlpha = 1;
    }
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    drawPoly(context, xx, yy, (drawSize / m.size) * m.realSize, m.shape, rot, instance.borderless, instance.drawFill, m.imageInterpolation);
    
    // Draw guns above us
    for (let i = 0; i < source.guns.length; i++) {
        context.lineWidth = initStrokeWidth
        let g = gunConfig[i];
        if (g.drawAbove) {
            let gx = g.offset * Math.cos(g.direction + g.angle + rot),
                gy = g.offset * Math.sin(g.direction + g.angle + rot),
                gunColor = g.color == null ? color.grey : gameDraw.modifyColor(g.color, baseColor),
                alpha = g.alpha,
                strokeWidth = g.strokeWidth,
                borderless = g.borderless,
                fill = g.drawFill;
            gameDraw.setColor(context, gameDraw.mixColors(gunColor, render.status.getColor(), blend));
            drawTrapezoid(context, xx + drawSize * gx, yy + drawSize * gy, drawSize * g.length / 2, drawSize * g.width / 2, g.aspect, g.angle + rot, borderless, fill, alpha, strokeWidth, drawSize * positions[i]);
        }
    }
    // Draw turrets above us
    for (let i = upperTurretsIndex; i < source.turrets.length; i++) {
        let t = source.turrets[i];
        context.lineWidth = initStrokeWidth * t.strokeWidth
        t.lerpedFacing == undefined
            ? (t.lerpedFacing = t.facing)
            : (t.lerpedFacing = util.lerpAngle(t.lerpedFacing, t.facing, 0.1, true));
        let ang = t.direction + t.angle + rot,
            len = t.offset * drawSize,
            facing;
        if (t.mirrorMasterAngle || turretsObeyRot) {
            facing = rot + t.angle;
        } else {
            facing = t.lerpedFacing;
        }
        drawEntity(baseColor, xx + len * Math.cos(ang), yy + len * Math.sin(ang), t, ratio, 1, (drawSize / ratio / t.size) * t.sizeFactor, lineWidthMult, facing, turretsObeyRot, context, t, render);
    }
    if (assignedContext == false && context != ctx && context.canvas.width > 0 && context.canvas.height > 0) {
        ctx.save();
        ctx.globalAlpha = alpha * fade;
        ctx.imageSmoothingEnabled = true;
        //ctx.globalCompositeOperation = "overlay";
        ctx.drawImage(context.canvas, x - xx, y - yy);
        ctx.restore();
        //ctx.globalCompositeOperation = "source-over";
    }
};
function drawHealth(x, y, instance, ratio, alpha) {
    let fade = instance.render.status.getFade();
    ctx.globalAlpha = fade * fade;
    let size = instance.size * ratio,
        indexes = instance.index.split("-"),
        m = global.mockups[parseInt(indexes[0])],
        realSize = (size / m.size) * m.realSize;
    if (instance.drawsHealth) {
        let health = instance.render.health.get(),
            shield = instance.render.shield.get();
        if (health < 0.99 || shield < 0.99) {
            let col = settings.graphical.coloredHealthbars ? gameDraw.mixColors(gameDraw.modifyColor(instance.color), color.guiwhite, 0.5) : color.lgreen;
            let yy = y + realSize + 15 * ratio;
            let barWidth = 3 * ratio;
            ctx.globalAlpha = fade * (alpha ** 2);
            //TODO: seperate option for hp bars
            // function drawBar(x1, x2, y, width, color) {

            //background bar
            drawBar(x - size, x + size, yy + barWidth * settings.graphical.seperatedHealthbars / 2, barWidth * (1 + settings.graphical.seperatedHealthbars) + settings.graphical.barChunk, color.black);

            //hp bar
            drawBar(x - size, x - size + 2 * size * health, yy + barWidth * settings.graphical.seperatedHealthbars, barWidth, col);

            //shield bar
            if (shield || settings.graphical.seperatedHealthbars) {
                if (!settings.graphical.seperatedHealthbars) ctx.globalAlpha = (1 + shield) * 0.3 * (alpha ** 2) * fade;
                drawBar(x - size, x - size + 2 * size * shield, yy, barWidth, settings.graphical.coloredHealthbars ? gameDraw.mixColors(col, color.guiblack, 0.25) : color.teal);
                ctx.globalAlpha = 1;
            }
        }
    }
    if (instance.id !== gui.playerid && instance.nameplate) {
        var name = instance.name.substring(7, instance.name.length + 1);
        var namecolor = instance.name.substring(0, 7);
        ctx.globalAlpha = alpha;
        drawText(name, x, y - realSize - 22 * ratio, 12 * ratio, namecolor, "center");
        drawText(util.handleLargeNumber(instance.score, 1), x, y - realSize - 12 * ratio, 6 * ratio, namecolor, "center");
        ctx.globalAlpha = 1;
    }
}
