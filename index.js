function linearfit(x, y){
    if(Array.isArray(x) && Array.isArray(y) && x.length === y.length){
        let n = x.length;
        let sumX = 0;
        let sumX2 = 0;
        let sumY = 0;
        let sumXY = 0;
        for(let i = 0; i < x.length; i++){
            sumX += x[i];
            sumX2 += x[i]*x[i];
            sumY += y[i];
            sumXY += x[i]*y[i];
        }

        return [1/(n*sumX2 - sumX*sumX)*(sumY*sumX2 - sumX*sumXY), 1/(n*sumX2 - sumX*sumX)*(n*sumXY - sumX*sumY)];

    } else {
        throw new Error('Check input');
    }
}