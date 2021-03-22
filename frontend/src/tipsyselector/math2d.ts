// Type definitions //
export abstract class Angle {
    abstract convertToRadiants(): RadiantsAngle;
    abstract convertToDegrees(): DegreeAngle;
}

export class DegreeAngle extends Angle {
    readonly degrees: number;

    constructor(degrees: number) {
        super();
        this.degrees = degrees % 360;
    }

    convertToDegrees() {
        return this;
    }

    convertToRadiants() {
        return new RadiantsAngle(this.degrees / 180 * Math.PI);
    }
}

export class RadiantsAngle extends Angle {
    readonly radiants: number;

    constructor(radiants: number) {
        super();
        this.radiants = radiants;
    }

    convertToDegrees() {
        return new DegreeAngle(this.radiants / (2 * Math.PI) * 360);
    }

    convertToRadiants() {
        return this;
    }
}

export class CartesianPoint {

    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Converts the cartesian coordinates of a point located on the given circle into polar coordinates. 
     */
    convertPointOnCircleToPolar(center: CartesianPoint, radius: number): PolarPoint {
        const centerToPoint: CartesianPoint = new CartesianPoint(
            this.x - center.x,
            this.y - center.y
        );

        // Determine in which quarter the point is located in and add the respective offset
        let quarterPhiBase, quarterOffset;
        if (centerToPoint.x >= 0) {
            if (centerToPoint.y >= 0) {
                quarterPhiBase = Math.asin(centerToPoint.y / radius);
                quarterOffset = 0;
            } else {
                quarterPhiBase = Math.asin(centerToPoint.x / radius);
                quarterOffset = 270;
            }
        } else {
            if (centerToPoint.y >= 0) {
                quarterPhiBase = Math.asin(centerToPoint.x / radius);
                quarterOffset = 90;
            } else {
                quarterPhiBase = Math.asin(centerToPoint.y / radius);
                quarterOffset = 180;
            }
        }

        const quarterPhi = new RadiantsAngle(Math.abs(quarterPhiBase)).convertToDegrees();

        return new PolarPoint(
            center,
            radius,
            new DegreeAngle(quarterPhi.degrees + quarterOffset)
        );
    }

    convertToPolar() {

    }

    calculateEuclideanDistance(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
}

export type Vector = CartesianPoint;

export class PolarPoint {

    center: CartesianPoint;
    radius: number;
    angle: Angle;

    constructor(center: CartesianPoint, radius: number, angle: Angle) {
        this.center = center;
        this.radius = radius;
        this.angle = angle;
    }

    convertToCartesian() {
        const angleInRadiants = this.angle.convertToRadiants();

        return new CartesianPoint(
            this.center.x + Math.cos(angleInRadiants.radiants) * this.radius,
            this.center.y + Math.sin(angleInRadiants.radiants) * this.radius
        );
    }

    normalize(baseAngle: DegreeAngle): PolarPoint {
        return new PolarPoint(
            this.center,
            this.radius,
            new DegreeAngle(((360 - baseAngle.degrees) + this.angle.convertToDegrees().degrees) % 360)
        );
    }
}
