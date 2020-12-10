const coefficients = [
    [5.42598, -0.05617, 1.66260, -0.74308, 1.24751, -1.09327, 0.93849, -9.53067],
    [5.67591, -0.05332, 1.79884, -0.70735, 1.02454, -1.08187, 0.87529, -10.93213],
    [5.73586, -0.04867, 1.83412, -0.71618, 0.82945, -1.08720, 0.96894, -10.94723],
    [5.64850, -0.04419, 1.84129, -0.69808, 0.80782, -1.08571, 1.10158, -11.61171]
];

const traces = [];

let inputform = document.getElementById('inputform');

inputform.addEventListener('submit', (e) => {
    e.preventDefault();

    clearPlot();
    //Read inputs
    let input = readInput();
    //Process inputs
    let k = processInput(input.k);
    //Calculate risk for disease progression
    let p = [];
    for(let i = 0; i < k.length; i++){
        let a = coefficients[i][0]
         + coefficients[i][1]*input['psa_surg']
         + coefficients[i][2]*Math.log(input.k[0].psa)
         + coefficients[i][3]*Math.log(input['t_surg_srt'])
         + coefficients[i][4]*input['gs']
         + coefficients[i][5]*input['surgmarg']
         + coefficients[i][6]*input['semves']
         + coefficients[i][7]*k[i];
         p.push(1.0/(1.0+Math.exp(-1*a)));
        //Fill in disease progression
        document.getElementById('p'+i).innerHTML = p[i];
    }

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
    for (let i = 0; i < 8; i++) {
        let tempPSA = parseFloat(inputform.elements['psa' + i].value);
        let tempDate = Date.parse(inputform.elements['date' + i].value);
        if (isNaN(tempPSA) || isNaN(tempDate)) break;
        if(i === 0) startdate = tempDate;
        input.k.push({
            psa: tempPSA,
            date: (tempDate - startdate)/(24*60*60*1000) //Divide by ms in 1 day to get days between dates
        });
    }

    input['psa_surg'] = parseFloat(inputform.elements['psa_surg'].value);
    input['t_surg_srt'] = parseFloat(inputform.elements['t_surg_srt'].value);
    input['gs'] = (parseInt(inputform.elements['gs'].value) >= 7) ? 1 : 0;
    input['surgmarg'] = parseInt(inputform.elements['surgmarg'].value);
    input['semves'] = parseInt(inputform.elements['semves'].value);


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
