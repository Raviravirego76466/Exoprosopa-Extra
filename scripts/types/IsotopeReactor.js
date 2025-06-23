class IsotopeReactor extends PowerGenerator {
    constructor(name) {
        super(name);
        this.ores = new Map();
        this.topRegion = null;
        this.lightRegion = null;
        this.generateEffect = Fx.generatespark;
        this.heatColor = Color.valueOf("ff9b59");
        this.list = [];
    }

    init() {
        super.init();
        this.clipSize = Math.max(this.clipSize, 100 * this.size * 2);
    }

    setStats() {
        super.setStats();
        this.stats.add(Stat.input, (table) => {
            table.left();
            this.list.length = 0; // Clear the list
            for (let b of this.ores.keys()) {
                this.list.push(b);
            }

            this.list.sort((a, b) => this.ores.get(b) - this.ores.get(a));

            table.table((l) => {
                l.left();

                for (let i = 0; i < this.list.length; i++) {
                    let item = this.list[i];

                    l.image(item.uiIcon).size(32);
                    l.add(` ${Math.floor(this.ores.get(item) * 100)}%`).color(item.mapColor);
                    if (i < this.list.length - 1) l.add(" / ");
                }
            });
        });
    }

    load() {
        super.load();
        this.topRegion = atlas.find(`${this.name}-top`);
        this.lightRegion = atlas.find(`${this.name}-light`);
    }

    canPlaceOn(tile, team, rotation) {
        return this.getSum(tile) > 0.00001;
    }

    drawPlace(x, y, rotation, valid) {
        super.drawPlace(x, y, rotation, valid);

        let t = world.tile(x, y);
        if (t != null) this.drawPlaceText(Core.bundle.formatFloat("bar.efficiency", this.getSum(t) * 100, 1), x, y, valid);
    }

    getEfficiency(b) {
        return this.ores.get(b) || 0;
    }

    getSum(tile) {
        return tile.getLinkedTilesAs(this, tempTiles).reduce((sum, t) => sum + this.getEfficiency(t.overlay()), 0);
    }
}

class IsotopeReactorBuild extends GeneratorBuild {
    constructor() {
        super();
        this.sum = 0;
        this.maxf = 0;
        this.heat = 0;
        this.maxB = null;
    }

    updateTile() {
        this.productionEfficiency = this.sum + MindyAttribute.magnetic.env();

        if (this.productionEfficiency > 0.1 && Math.random() < 0.05 * this.delta()) {
            this.generateEffect.at(this.x + Mathf.range(3), this.y + Mathf.range(3), this.maxB ? this.maxB.mapColor : Pal.lightishGray);
        }
        this.heat = Mathf.lerpDelta(this.heat, this.productionEfficiency > 0.1 ? 1 : 0, 0.05);
    }

    draw() {
        super.draw();
        Draw.color(this.heatColor);
        Draw.alpha(this.heat * 0.4 + Mathf.absin(Time.time, 8, 0.6) * this.heat);
        Draw.rect(this.topRegion, this.x, this.y);
        Draw.reset();

        if (this.maxB != null) {
            Draw.z(Layer.bullet - 0.001);
            Draw.color(this.maxB.mapColor, this.heat);
            Draw.rect(this.lightRegion, this.x, this.y);
            Draw.reset();
        }
    }

    drawLight() {
        if (this.maxB != null) Drawf.light(this.x, this.y, this.heat * (40 + Mathf.absin(10, 5)) * Math.min(this.productionEfficiency, 2) * this.size, this.maxB.mapColor, 0.4);
    }

    onProximityAdded() {
        super.onProximityAdded();

        this.maxf = 0;
        this.sum = this.tile.getLinkedTilesAs(this.block, tempTiles).reduce((sum, t) => {
            let g = this.getEfficiency(t.overlay());
            if (g > 0.0001 && (!this.maxB || g > this.maxf)) {
                this.maxf = g;
                this.maxB = t.overlay();
            }
            return sum + g;
        }, 0);
    }
}
