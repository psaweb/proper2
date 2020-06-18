let inputform = document.getElementById('inputform');
inputform.addEventListener('submit', (e) => {
    e.preventDefault();
    let x = [];
    let y = [];
    let lny = [];
    for(let i = 1; i < 8; i++){
        let ytemp = parseFloat(inputform.elements['psa'+i].value);
        if(isNaN(ytemp)) break;
        x.push(i);
        y.push(ytemp);
        lny.push(-1*Math.log(ytemp));
    }
    let trace1 = {
        x: x,
        y: y,
        mode: 'markers'
    }
    let b = linearfit(x,lny);
    //let ynew = x.map(x => b[0] + b[1]*x);
    let xnew = [];
    for(let i = 0; i < x[x.length -1]; i += 0.01){
        xnew.push(i);
    }
    let ynew = xnew.map(x => Math.exp(-b[0])*Math.exp(-b[1]*x) );

    let trace2 = {
        x: xnew,
        y: ynew,
        mode: 'lines'
    }
    Plotly.newPlot('plotarea', [trace1, trace2], {}, {displaylogo: false});
});



//Linear fit least square
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