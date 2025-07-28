// Displays the options to see the temperature history or signal history and to set the duration and type of the history
function historyOptions() {
  document.getElementById('history_options').innerHTML = `
      <div class="card history-card">
        <div class="history-section">
          <h4>History Options</h4>
          <p>Choose a history type and duration to view.</p>

          <div class="history-row">
            <button onclick="getTempHistory()">Temperature History</button>
            <select class="styled-select" id="tempDuration">
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="6months">Past 6 Months</option>
              <option value="year">Past Year</option>
            </select>
            <select class="styled-select" id="tempGraphType">
              <option value="temp">Real Temperature</option>
              <option value="set_temp">Set Temperature</option>
              <option value="pressure">Pressure</option>
            </select>
          </div>
          <p class="description">View the real (measured) temperature, set temperature and pressure over time.</p>
        </div>

        <div class="history-section">
          <div class="history-row">
            <button onclick="getSignalHistory()">Signal History</button>
            <select class="styled-select" id="signalDuration">
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="6months">Past 6 Months</option>
              <option value="year">Past Year</option>
            </select>
            <select class="styled-select" id="signalGraphType">
              <option value="wifi_signal">WiFi Signal</option>
              <option value="rf_signal">RF Signal</option>
            </select>
          </div>
          <p class="description">Review WiFi and RF (radio frequency) signal strength fluctuations.</p>
          <button id="hideButton" onclick="hideHistory()">Hide History</button>
        </div>
      </div>
      `;
}

// Gets the history of signal strength for the selected type and duration
function getSignalHistory() {
  const id = document.getElementById('esp_id').value.trim();
  const duration = document.getElementById('signalDuration').value.trim();
  const dates = getDurationDates(duration)
  const graphType = document.getElementById('signalGraphType').value.trim();

  ws = new WebSocket("ws://localhost:300/socket/"); //"wss://raspiwebsocket.duckdns.org/socket/"

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: "signal_history",
      starting_date: dates[0],
      ending_date: dates[1],
      column_list: [graphType, 'recorded'],
      esp_id: id
    }));
  }

  ws.onmessage = (recievedMessage) => {
    const message = JSON.parse(recievedMessage.data);
    if (message.type === "signal_history" && message.success) {
      const data = message.data;
      document.getElementById('displayed_history').innerHTML = `
      <div class="chart card">
        <div id="chart"></div>  
      </div>`;

      makeChart(data, graphType).then(chart => chart.render());
    }
    else if (!(message.success) && message.reason === "No data found") {
      console.log("No data found for signal history request");
      document.getElementById('displayed_history').innerHTML = `
      <div class="card">
        <h2>No data found for the selected duration.</h2>
      </div>`;
    }
  }

  ws.onerror = (err) => {
    console.error("WebSocket error", err);
    alert("Connection error, try again later");
  };
}

// Gets the history of temperature for the selected type and duration
function getTempHistory() {
  const id = document.getElementById('esp_id').value.trim();
  const duration = document.getElementById('tempDuration').value.trim();
  const dates = getDurationDates(duration);
  const graphType = document.getElementById('tempGraphType').value.trim();

  ws = new WebSocket("ws://localhost:300/socket/"); //"wss://raspiwebsocket.duckdns.org/socket/"

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: "temperature_history",
      starting_date: dates[0],
      ending_date: dates[1],
      column_list: [graphType, 'recorded'],
      esp_id: id
    }));
  }

  ws.onmessage = async (recievedMessage) => {
    const message = JSON.parse(recievedMessage.data);

    // If the inquery was successful and data was received, it displays the data as a chart
    if (message.type === "temperature_history" && message.success) {
      const data = message.data;
      document.getElementById('displayed_history').innerHTML = `
      <div class="chart card">
        <div id="chart"></div>  
      </div>`;

      makeChart(data, graphType).then(chart => chart.render());
    }
    else {
      document.getElementById('displayed_history').innerHTML = `
      <div class="card">
        <h2>Temperature History</h2>
        <p>No data found for the selected duration.</p>
      </div>`;
    }
  }
}

// Hides the history options and displayed history
function hideHistory() {
  document.getElementById('history_options').innerHTML = '';
  document.getElementById('displayed_history').innerHTML = '';
}

// Function which gives the starting and ending of date of the given duration (week, month, six months or year)
// The ending date is always now and the estarting is now - duration
// Returns the dates, formated the same as timestamps in MySQL database
function getDurationDates(duration) {
  const now = new Date();
  let cutoffDate = new Date();

  switch (duration) {
      case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
      case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      case '6months':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
      case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
  }

  return [formatDateForMySQL(cutoffDate), formatDateForMySQL(now)];
}

// Formats the date into a string suitable for MySQL queries
function formatDateForMySQL(date) {
    const pad = num => num.toString().padStart(2, '0');
    
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// Function to create a chart using ApexCharts
// It takes the data and type of chart as parameters, it returns a chart object
// The type can be "realTemp", "setTemp", "pressure", "wifi" or "rf"
async function makeChart(data, type) {
  let chartName, chartColor;
  switch (type) {
    case "temp":
      chartName= "Real Temperature (°C)";
      chartColor = "#ff7e61ff"; 
      break;
    case "set_temp":
      chartName= "Set Temperature (°C)";
      chartColor = "#ffa346ff";
      break;
    case "pressure":
      chartName= "Pressure (kPa)";
      chartColor = "#6cd3ffff"; 
      break;
    case "wifi_signal":
      chartName= "WiFi Signal (dBm)";
      chartColor = "#004cffff"; 
      break;
    case "rf_signal":
      chartName = "RF Signal (dBm)";
      chartColor = "#8eff91ff"; 
      break;
  }
  const options = {
      series: [{
        name: chartName,
        data: data.map(item => ({
          x: item.recorded,
          y: item[type]
        }))
      }],
      chart: {
        type: 'line',
        height: 350
      },
      yaxis: {
        title: {
          text: chartName
        },
      },
      colors : [chartColor],
      xaxis: {
        type: 'datetime'
      }
    };

    var chart = new ApexCharts(document.querySelector("#chart"), options);
    return chart;
}