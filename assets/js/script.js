const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
let data = {
    grow: 10,
    today: undefined,
    sportsToday: {},
    scores: {
        'sit-up': [0, 0, 0],
        'pull-up': [0, 0, 0],
        'push-up(1)': [0, 0, 0],
        'push-up(2)': [0, 0, 0],
    },
    history: [],
    planning: {
        Mon: ['sit-up'],
        Tue: ['push-up(2)'],
        Wed: ['pull-up'],
        Thu: ['sit-up'],
        Fri: ['sit-up'],
        Sat: ['push-up(2)'],
        Sun: ['pull-up'],
    },
};

const chart = LightweightCharts.createChart(document.querySelector('#chart'), {
    width: window.innerWidth * 0.9,
    height: 300,
    autoSize: true,
    layout: {
        backgroundColor: 'rgba(0,0,0,0)',
        textColor: '#eff7a8',
    },
    timeScale: {
        ticksVisible: true,
        rightOffset: 0.1,
    },
});

const areaSeriesDay = chart.addAreaSeries({
    topColor: 'rgba(0, 255, 0, 0.9)',
    bottomColor: 'rgba(225, 255, 0, 0.1)',
    lineColor: 'rgba(0, 255, 0, 1)',
    lineWidth: 2,
});

const areaSeriesSet = chart.addAreaSeries({
    topColor: 'rgba(255, 255, 0, 0.9)',
    bottomColor: 'rgba(255, 0, 0, 0.1)',
    lineColor: 'rgba(255, 255, 0, 1)',
    lineWidth: 2,
});

document.addEventListener('DOMContentLoaded', init);

function init() {
    loadData();
    printSportsToday();
    printPlanning();
    printScores();
    fillFormItems();
    document.querySelector('#Try form').addEventListener('submit', addNewScore);
    document.querySelectorAll('.navBtn').forEach(d => d.addEventListener('click', changePage));
    document.querySelector('#changeBtn').addEventListener('click', changePlanning);
    document
        .querySelectorAll('.changePlanning .cancel')
        .forEach(d => d.addEventListener('click', cancelChangePlanning));
    document.querySelector('#changeDay').addEventListener('change', updatePlanning);
    document.querySelector('#changePlanning').addEventListener('submit', submitPlanning);
    document.querySelector('#deleteLast').addEventListener('dblclick', deleteLast);
    document.querySelector('#settings').addEventListener('submit', changeSettings);
    document.querySelector('#chartSport').addEventListener('change', makeChart);
    document
        .querySelectorAll('.subForm.button')
        .forEach(d => d.addEventListener('click', toggleSubForm));
    document
        .querySelectorAll('.subForm .reset')
        .forEach(d => d.addEventListener('click', toggleSubForm));
    document.querySelector('.delSport .delete').addEventListener('click', deleteSport);
    document.querySelector('.addSport .add').addEventListener('click', addSport);
    makeChart();
}

function addSport(e) {
    const subForm = e.target.closest('.addSport');
    const textElem = subForm.querySelector('input[type="text"]');
    sport = textElem.value;
    if (!sport || data.scores[sport]) {
        return;
    }
    textElem.value = '';
    data.scores[sport] = [0, 0, 0];
    recountScores();
    saveData();
    subForm.classList.remove('active');
    document.querySelector('#addSport').classList.add('active');
    printScores();
    fillFormItems();
}

function deleteSport(e) {
    const subForm = e.target.closest('.delSport');
    const selectElem = subForm.querySelector('select');
    const sport = selectElem.value;
    if (!sport) {
        return;
    }
    selectElem.selectedIndex = 0;
    data.scores = Object.fromEntries(
        Object.entries(data.scores).filter(scores => scores[0] != sport)
    );
    Object.keys(data.planning).forEach(day => {
        data.planning[day] = data.planning[day].filter(daySport => daySport != sport);
    });
    makeSportsToday(data.today);
    saveData();
    subForm.classList.remove('active');
    document.querySelector('#delSport').classList.add('active');
    printScores();
    printSportsToday();
    fillFormItems();
    printPlanning();
}

function toggleSubForm(e) {
    if (e.target.classList.contains('button')) {
        e.target.classList.remove('active');
        document.querySelector('.' + e.target.id).classList.add('active');
    } else {
        const elem = e.target.closest('.form');
        console.log(elem);
        elem.classList.remove('active');
        document.querySelector('#' + elem.classList[0]).classList.add('active');
    }
}

function loadData() {
    let savedData = localStorage.getItem('sportData');
    if (savedData) {
        data = JSON.parse(savedData);
    }
}

function saveData() {
    localStorage.setItem('sportData', JSON.stringify(data));
}

function changeSettings(e) {
    e.preventDefault();
    data.grow = e.target.grow.value;
    makeSportsToday(data.today);
    saveData();
    printSportsToday();
    changePage({ target: { value: 'Home' } });
}

function recountScores(print = false) {
    const newScores = Object.fromEntries(Object.keys(data.scores).map(sport => [sport, [0, 0, 0]]));
    const emptyDailyScores = Object.fromEntries(Object.keys(data.scores).map(sport => [sport, 0]));
    let dailyScores = { ...emptyDailyScores };
    const today = getCurrentDay();
    let checkDay;
    const checkDaily = () => {
        Object.keys(dailyScores).forEach(k => {
            if (dailyScores[k] > newScores[k][1]) {
                newScores[k][1] = dailyScores[k];
            }
        });
    };
    data.history.forEach(({ day, set, sport }) => {
        if (!newScores[sport]) {
            return;
        }
        if (checkDay != day) {
            checkDaily();
            dailyScores = { ...emptyDailyScores };
            checkDay = day;
        }
        if (set > newScores[sport][0]) {
            newScores[sport][0] = set;
        }
        dailyScores[sport] += set;
    });
    checkDaily();
    if (checkDay == today) {
        Object.keys(dailyScores).forEach(k => (newScores[k][2] = dailyScores[k]));
    }
    data.scores = newScores;
    makeSportsToday(data.today);
    saveData();
    printSportsToday();
    printScores();
}

function deleteLast() {
    data.history.pop();
    recountScores();
    saveData();
    const last = data.history?.at(-1);
    if (last) {
        document.querySelector('#last').innerText = `${last.day} ${last.set} ${last.sport}`;
    } else {
        document.querySelector('#last').innerText = 'No history yet';
    }
}

function fillFormItems() {
    const sportOptions = Object.keys(data.scores)
        .map(sport => `<option value="${sport}">${sport}</option>`)
        .join('');
    document.querySelector('#chartSport').innerHTML = sportOptions;
    document.querySelector('.delSport select').innerHTML =
        '<option value=""  disabled selected hidden>Select sport</option>' + sportOptions;
    document.querySelector('#sport').innerHTML =
        '<option   disabled selected hidden>Select sport</option>' + sportOptions;
    document.querySelector('#changeDay').innerHTML =
        '<option  disabled selected hidden>Chose day</option>' +
        days.map(day => `<option value="${day}">${day}</option>`).join('');
    document.querySelector('#changePlanningCheckboxes').innerHTML = Object.keys(data.scores)
        .map(
            sport => `
            <label for="${sport}" class="checkbox">${sport}
                <input type="checkbox" name="${sport}" id="${sport}">
            </label>`
        )
        .join('');
    const last = data.history?.at(-1);
    if (last) {
        document.querySelector('#last').innerText = `${last.day} ${last.set} ${last.sport}`;
    } else {
        document.querySelector('#last').innerText = 'No history yet';
    }
    document.querySelector('#grow').value = data.grow;
}

function makeChart() {
    const sport = document.querySelector('#chartSport').value;
    const sets = [];
    const days = [];
    let temp = [false, 0, 0];
    data.history
        .filter(history => history.sport == sport)
        .forEach(history => {
            if (!temp[0]) {
                temp[0] = history.day;
            }
            if (temp[0] != history.day) {
                sets.push({ time: temp[0], value: temp[1] });
                days.push({ time: temp[0], value: temp[2] });
                temp = [history.day, 0, 0];
            }
            temp[1] = Math.max(temp[1], history.set);
            temp[2] += history.set;
        });
    if (temp[0]) {
        sets.push({ time: temp[0], value: temp[1] });
        days.push({ time: temp[0], value: temp[2] });
    }
    areaSeriesDay.setData(days);
    areaSeriesSet.setData(sets);
    chart.timeScale().applyOptions({
        barSpacing: 75,
    });
}

function submitPlanning(e) {
    e.preventDefault();
    const newData = [...new FormData(e.target).entries()];
    if (!newData[0][0] == 'changeDay') {
        return;
    }
    data.planning[newData[0][1]] = newData.filter(d => d[1] == 'on').map(d => d[0]);
    saveData();
    printPlanning();
    makeSportsToday(data.today);
    printSportsToday();
    cancelChangePlanning(e);
}

function updatePlanning(e) {
    document.querySelectorAll('.changePlaning2').forEach(d => d.classList.add('active'));
    const sports = data.planning[e.target.value];
    document.querySelectorAll('#changePlanning .checkbox input').forEach(checkbox => {
        checkbox.checked = sports.includes(checkbox.id);
    });
}

function cancelChangePlanning(e) {
    e.target.closest('form').reset();
    document.querySelectorAll('.changePlanning.active').forEach(d => d.classList.remove('active'));
    document.querySelector('#changeBtn').classList.add('active');
    document.querySelectorAll('.changePlaning2').forEach(d => d.classList.remove('active'));
}

function changePlanning(e) {
    e.target.classList.remove('active');
    document.querySelector('#changePlanning').classList.add('active');
}

function getCurrentDay() {
    return new Date().toLocaleDateString('sv-SE');
}

function addNewScore(e) {
    e.preventDefault();
    const newScore = Object.fromEntries(new FormData(e.target).entries());
    if (!newScore.sport) {
        return;
    }
    newScore.day = getCurrentDay();
    newScore.set = Number(newScore.set);
    document.querySelector('#last').innerText = `${newScore.day} ${newScore.set} ${newScore.sport}`;
    data.history.push(newScore);
    resetScoresForNewDay();
    const scores = data.scores[newScore.sport];
    scores[2] += newScore.set;
    if (newScore.set > scores[0]) {
        scores[0] = newScore.set;
    }
    if (scores[2] > scores[1]) {
        scores[1] = scores[2];
    }
    const scoreToday = data.sportsToday[newScore.sport];
    if (scoreToday) {
        if (scoreToday.set.done < newScore.set) {
            scoreToday.set.done = newScore.set;
        }
        scoreToday.day.done = scores[2];
    }
    saveData();
    e.target.reset();
    printSportsToday();
    printScores();
    document.querySelectorAll('main.visible').forEach(d => d.classList.remove('visible'));
    document.querySelector('#Home').classList.add('visible');
}

function resetScoresForNewDay() {
    const today = getCurrentDay();
    if (today == data.today) {
        return;
    }
    data.today = today;
    Object.keys(data.scores).forEach(sport => (data.scores[sport][2] = 0));
    saveData();
    printSportsToday();
    printScores();
}

function changePage(e) {
    document.querySelectorAll('main.visible').forEach(d => d.classList.remove('visible'));
    const page = e.target.value == 'Back' ? 'Home' : e.target.value;
    document.querySelector(`#${page}`).classList.add('visible');
    if (page == 'History') {
        makeChart();
    }
}

function printSportsToday() {
    const today = getCurrentDay();
    if (data.today != today) {
        makeSportsToday(today);
    }
    document.querySelector('#today').innerHTML = Object.entries(data.sportsToday)
        .map(
            ([k, v]) => `
        <li class="${v.set.done >= v.set.total && v.day.done >= v.day.total ? 'completed' : ''}">
            <h2>${k}</h2>
            <div>
                <h3>Set +${v.set.extra}</h3>
                <div class="loadbar">
                    <p class="count">${v.set.done}/${v.set.total}</p>
                    <div class="loader" style="width:${Math.ceil(
                        (v.set.done * 100) / v.set.total
                    )}%"></div>
                </div>
            </div>
                 <div>
                <h3>Day +${v.day.extra}</h3>
                <div class="loadbar">
                    <p class="count">${v.day.done}/${v.day.total}</p>
                    <div class="loader" style="width:${Math.ceil(
                        (v.day.done * 100) / v.day.total
                    )}%"></div>
                </div>
            </div>
        </li>
        `
        )
        .join('');
}

function makeSportsToday(today) {
    const day = days[(new Date(today).getDay() + 6) % 7];
    console.log(day);
    data.sportsToday = Object.fromEntries(
        data.planning[day].map(sport => {
            const oldScore = [...data.scores[sport]];
            let setDone = 0;
            if (oldScore[2]) {
                setDone = data.history
                    .filter(history => history.sport == sport && history.day == today)
                    .reduce((acc, history) => Math.max(acc, history.set), 0);
                const passed = data.history.filter(
                    history => history.sport == sport && history.day != today
                );
                oldScore[0] = passed.reduce((acc, { set }) => Math.max(acc, set), 0);
                oldScore[1] = passed.reduce((acc, { day, set }) => {
                    acc[day] = (acc[day] || 0) + set;
                    return acc;
                }, {});
                console.log(oldScore[1]);
                oldScore[1] = Math.max(...Object.values(oldScore[1]), 0);
            }
            const grow = [
                Math.ceil(oldScore[0] * (data.grow / 100)) || 1,
                Math.ceil(oldScore[1] * (data.grow / 100)) || 1,
            ];
            return [
                sport,
                {
                    set: { extra: grow[0], total: oldScore[0] + grow[0], done: setDone },
                    day: { extra: grow[1], total: oldScore[1] + grow[1], done: oldScore[2] },
                },
            ];
        })
    );
    data.today = today;
    saveData();
}

function printScores() {
    document.querySelector('#scores tbody').innerHTML = Object.entries(data.scores)
        .map(([k, v]) => `<tr><td>${k}</td><td>${v[0]}</td><td>${v[1]}</td><td>${v[2]}</td></tr>`)
        .join('');
}

function printPlanning() {
    document.querySelector('#Planning table tbody').innerHTML = days
        .map(day => `<tr><td>${day}</td><td>${data.planning[day].join(', ')}</td></tr>`)
        .join('');
}
