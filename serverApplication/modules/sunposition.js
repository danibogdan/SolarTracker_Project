function solarDataLocally(lat, lon, date = new Date()){

    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    const tzOffset = -date.getTimezoneOffset() / 60; // local timezone offset in hours

    // Day of year
    const start = new Date(date.getFullYear(), 0, 0);
    const diff =
        (date - start) + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000;
    const dayOfYear = Math.floor(diff / 86400000);

    // Fractional year (in radians)
    const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
    const gamma =
        (2 * Math.PI / 365) * (dayOfYear - 1 + (hour - 12) / 24);

    // Equation of time (minutes)
    const eqTime =
        229.18 *
            (0.000075 +
                0.001868 * Math.cos(gamma) -
                0.032077 * Math.sin(gamma) -
                0.014615 * Math.cos(2 * gamma) -
                0.040849 * Math.sin(2 * gamma));

    // Solar declination (radians)
    const decl =
        0.006918 -
            0.399912 * Math.cos(gamma) +
            0.070257 * Math.sin(gamma) -
            0.006758 * Math.cos(2 * gamma) +
            0.000907 * Math.sin(2 * gamma) -
            0.002697 * Math.cos(3 * gamma) +
            0.00148 * Math.sin(3 * gamma);

    // Time offset (minutes)
    const timeOffset = eqTime + 4 * lon - 60 * tzOffset;
    const trueSolarTime = (hour * 60 + timeOffset) % 1440;

    // Hour angle (degrees)
    const hourAngle = trueSolarTime / 4 < 0
        ? trueSolarTime / 4 + 180
        : trueSolarTime / 4 - 180;

    // Convert to radians
    const haRad = toRad(hourAngle);
    const latRad = toRad(lat);

    // Solar elevation angle (radians)
    const elevRad = Math.asin(
        Math.sin(latRad) * Math.sin(decl) +
            Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad)
    );
    let elevation = toDeg(elevRad);

    // Solar azimuth angle (degrees)
    const azRad = Math.atan2(
        Math.sin(haRad),
        Math.cos(haRad) * Math.sin(latRad) - Math.tan(decl) * Math.cos(latRad)
    );
    let azimuth = (toDeg(azRad) + 180) % 360;

    // Optional: atmospheric refraction correction
    if (elevation > -1) {
        elevation += 1.02 / Math.tan(toRad(elevation + 10.3 / (elevation + 5.11))) / 60;
    }

    return {
        elevation, // degrees above horizon
        azimuth,   // degrees clockwise from north
        declination: toDeg(decl),
        hourAngle,
    };
}

module.exports = solarDataLocally;
