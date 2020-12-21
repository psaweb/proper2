const coefficients = {
    intercept: 4.29036,
    psa0: 1.481586,
    t_surg_srt: -0.566218,
    gs: 1.062178,
    surgmarg: -1.149864,
    k: -10.509373
}

const traces = [];

let inputform = document.getElementById('inputform');

inputform.addEventListener('submit', (e) => {
    e.preventDefault();

    clearPlot();
    //Read inputs
    let input = readInput();
    //Process inputs
    let k = processInput(input.k);
    console.log(k);
    //Calculate risk for disease progression
    let a = coefficients.intercept
        + coefficients.psa0 * Math.log(input.k[0].psa)
        + coefficients.t_surg_srt * Math.log(input['t_surg_srt'])
        + coefficients.gs * input['gs']
        + coefficients.surgmarg * input['surgmarg']
        + coefficients.k * k[0];

    let p = 1.0/(1.0+Math.exp(-1*a))
    document.getElementById('p0').innerHTML = p;

    plot();
});

//Clear inputs when pressing reset
const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', () => {
    for(let i = 0; i < 4; i++){
        document.getElementById('p'+i).innerHTML = '';
        document.getElementById('k'+i).innerHTML = '';
    }
    clearPlot();
    plot();
});



function readInput() {
    //Read PSA Values and corresponding dates
    let input = {
        k: []
    };
    let startdate = 0;
    for (let i = 0; i < 5; i++) {
        let tempPSA = parseFloat(inputform.elements['psa' + i].value);
        let tempDate = Date.parse(inputform.elements['date' + i].value);
        if (isNaN(tempPSA) || isNaN(tempDate)) break;
        if(i === 0) startdate = tempDate;
        input.k.push({
            psa: tempPSA,
            date: (tempDate - startdate)/(24*60*60*1000) //Divide by ms in 1 day to get days between dates
        });
    }

    input['t_surg_srt'] = parseFloat(inputform.elements['t_surg_srt'].value);
    input['surgmarg'] = parseInt(inputform.elements['surgmarg'].value);


    //Calculate gleason factor
    let gs1 = parseInt(inputform.elements['gs_1'].value);
    let gs2 = parseInt(inputform.elements['gs_2'].value);
    let gs = 0;
    if(gs1 >= 5 || gs2 >= 5){
        gs = 1;
    }else if(gs1 === 4){
        gs = 1;
    }else if (gs1 <= 3){
        gs = 0;
    }

    input['gs'] = gs;


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
        if(i >= 4){
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

    let kweek = [];
    //Fill k-values
    for(let i = 0; i < k.length; i++){
        kweek.push(k[i][1]*7);
        document.getElementById('k'+i).innerHTML = k[i][1] * 7;

        //Add new traces to plot
        traces.push({
            x: xexp,
            y: xexp.map(x => Math.exp(-k[i][0]) * Math.exp(-k[i][1] * x)),
            mode: 'lines',
            name: 'k 1w-' + (i+4) + 'w' 
        });
    }

    return kweek;
    
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
