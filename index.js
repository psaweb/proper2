const traces = [];

let inputform = document.getElementById('inputform');

inputform.addEventListener('submit', (e) => {
    e.preventDefault();

    clearPlot();
    //Read inputs
    let input = readInput();
    //Process inputs
    processInput(input);
    plot();
});

function readInput() {
    //Read PSA Values and corresponding dates
    let input = [];
    let startdate = 0;
    for (let i = 0; i < 8; i++) {
        let tempPSA = parseFloat(inputform.elements['psa' + i].value);
        let tempDate = Date.parse(inputform.elements['date' + i].value);
        if (isNaN(tempPSA) || isNaN(tempDate)) break;
        if(i === 0) startdate = tempDate;
        input.push({
            psa: tempPSA,
            date: (tempDate - startdate)/(24*60*60*1000) //Divide by ms in 1 day to get days between dates
        });
    }


    return input;
}

function processInput(input) {
    let x = [];
    let y = [];
    let lny = [];
    let k = [];
    for(let i = 1; i < input.length; i++) {
        x.push(input[i].date);
        y.push(input[i].psa);
        lny.push(-1 * Math.log(input[i].psa));
        if(i >= 3){
            k.push(linearfit(x, lny));
        }
    }

    //Add PSA0 to plot
    traces.push({
        x: [input[0].date],
        y: [input[0].psa],
        mode: 'markers',
        name: 'PSA0'
    });

    //Add other PSA values to plot
    traces.push({
        x: x,
        y: y,
        mode: 'markers',
        name: 'PSA'
    });

    //Create new x-values for caluculating exp trace.
    let xexp = [];
    for(let i = input[1].date; i < input[input.length -1].date; i+=0.01){
        xexp.push(i);
    }

    //Clear k values
    let spans = document.getElementsByTagName('span');
    for(let i = 0; i < spans.length; i++){
        spans[i].innerHTML = '';
    }

    //Fill k-values
    for(let i = 0; i < k.length; i++){
        document.getElementById('k'+i).innerHTML = k[i][1] * 7;

        //Add new traces to plot
        traces.push({
            x: xexp,
            y: xexp.map(x => Math.exp(-k[i][0]) * Math.exp(-k[i][1] * x)),
            mode: 'lines',
            name: 'k 1w-' + (i+3) + 'w' 
        });
    }
    
}

function plot() {
    let layout = {
        xaxis: {title: 'Days'},
        yaxis: {title: 'PSA [ng/ml]'},
        showlegend: true
    }
    Plotly.newPlot('plotarea', traces, layout, { displaylogo: false });
}

function clearPlot() {
    traces.length = 0;
}


//Linear least square fit
function linearfit(x, y) {
    if (Array.isArray(x) && Array.isArray(y) && x.length === y.length) {
        let n = x.length;
        let sumX = 0;
        let sumX2 = 0;
        let sumY = 0;
        let sumXY = 0;
        for (let i = 0; i < x.length; i++) {
            sumX += x[i];
            sumX2 += x[i] * x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
        }

        return [1 / (n * sumX2 - sumX * sumX) * (sumY * sumX2 - sumX * sumXY), 1 / (n * sumX2 - sumX * sumX) * (n * sumXY - sumX * sumY)];

    } else {
        throw new Error('Check input');
    }
}