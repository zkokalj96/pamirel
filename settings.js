// Function which displays an html form to set a new temperature
function setTemp() {
  document.getElementById('setting_temperature').innerHTML = `
    <div class="settings card">
      <h2>Set Temperature</h2>
      <div class="rules">
        <h4>Temperature should be:</h4>
        <ul>
          <li><p>In the range 10°C - 30°C</p></li>
          <li><p>Set to no more than one decimal place (<del>14.22</del> 14.2 <i style="font-size:20px" class="fa">&#10004;</i> ) </p></li>
        </ul>
      </div>
      <p class="description">Enter the desired temperature:</p>
      <input type="number" id="new_temp" placeholder="Temperature in °C" />
      <button onclick="submitTemp()">Submit</button>

      <p id="setting_successful"></p>

      <button id="hideButton" onclick="hideSettings()">Hide Settings</button>
    </div>
  `;
}

/* 
Function which submits the new temperature to the ESP via the WebSocket server
It checks if the input is valid before sending it
After recieveing conformation of the change, it displays some text to the website
Alternatively, it displays the error and reason
*/
function submitTemp() {
  const newTemp = document.getElementById('new_temp').value.trim();
  const id = document.getElementById('esp_id').value.trim();
  
  ws = new WebSocket("wss://raspiwebsocket.duckdns.org/socket/");

  if (!newTemp) {
    alert("Please enter a temperature");
    return;
  }
  // Check if the input is a valid number and within the expected range
  else if (isNaN(newTemp) || newTemp < 10 || newTemp > 30) {
    alert("Please enter a valid temperature between 0 and 30 °C");
    return;
  }
  // Check if the input has no more than one decimal place
  else if (newTemp.toString().length > 4 ) {
    alert("Please enter a temperature with no more than one decimal place");
    return;
  }

  ws.onopen = () => {
    console.log("sent the new temperature to the ESP");
    ws.send(JSON.stringify({
      type: "changing_set_temp",
      esp_id: id,
      new_temp: parseFloat(newTemp)
    }));
  };

  ws.onmessage = (recievedMessage) => {
    const message = JSON.parse(recievedMessage.data);
    if (message.type === "changing_set_temp" && message.success) {
      document.getElementById("setting_successful").innerHTML = `
      <h4>Setting changes stored successfully!</h4>
      <p>Temperature for device ${id} is set to ${newTemp} °C</p>
      <p>Expect the changes to be implemented in the next 5 minutes</p>
      `;
    } else {
      alert(message.reason)
    }
  };
}

// Function to hide the settings form
function hideSettings() {
  document.getElementById('setting_temperature').innerHTML = '';
}
