
// Handles logins, checks if id and password inputs have been given, if not gives an alert
// and if they are valid, sends a message to the backend
function login() {
  const id = document.getElementById('esp_id').value.trim();
  const pass = document.getElementById('password').value;

  if (!id || !pass) {
    alert("Please enter ID and password");
    return;
  }

  // Initialising websocket communication with the url where its hosted
  ws = new WebSocket("wss://raspiwebsocket.duckdns.org/socket/"); //"wss://raspiwebsocket.duckdns.org/socket/"

  // When connection is established sends the credentials to check if they are valid
  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: "login",
      esp_id: id,
      password: pass
    }));
  };

  // When a message is received, checks if it is a login message and if it was successful
  // If it was, displays the thermostat state and options to view history or set temperature
  ws.onmessage = (recievedMessage) => {
    const message = JSON.parse(recievedMessage.data);
    if (message.type === "login" && message.success) {
      const latestData = message.latest_data;
      
      const state = (latestData.status_on == 1) ? `ON, and it is ${(latestData.heating) ? "heating" : "cooling"}` : "OFF";
      
      document.getElementById('login_successful').innerHTML = `
      <div class="card">
        <h2>Login successful!</h2>
        <h3>Thermostat ${id} is currently ${state} </h3>
          <p>Current Temperature: ${latestData.temp} °C</p>
          <p>Set Temperature: ${latestData.set_temp} °C</p>
          <p>Pressure: ${latestData.pressure} kPa</p>
          <p>Ventilator speed: ${latestData.ventilator} / 3</p>
          <p>Set Ventilator speed: ${latestData.set_ventilator} / 3</p>
          <p>At ${formatDateForUser(latestData.recorded)}</p>
        <div class="actions">
          <button onclick="historyOptions()">Show History</button>
          <button onclick="setTemp()">Set Temperature</button>
        </div>
      </div>
      `;
    } else {
      document.getElementById('login_successful').innerHTML = `
      <div class="card">
        <h2>Login failed!</h2>
        <p>Double-check ID and password.</p>
      </div>
      `;}
  };

  ws.onerror = (err) => {
    console.error("WebSocket error", err);
    alert("Connection error, try again later");
  };
}

// Formats MySQL timestamps into '{time} on {date}' strings
function formatDateForUser(mysqlTimestamp) {
  const date = new Date(mysqlTimestamp);

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are 0-indexed
  const year = date.getFullYear();

  const formatted = `${hours}:${minutes}:${seconds} on ${day}. ${month}. ${year}`;
  return formatted;
}
