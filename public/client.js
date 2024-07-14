const socket = io();

socket.on('log', (message) => {
    const table = document.getElementById('logs');
    const row = document.createElement('tr');

    const usernameCell = document.createElement('td');
    usernameCell.textContent = message.username;
    row.appendChild(usernameCell);

    const emailCell = document.createElement('td');
    emailCell.textContent = message.email;
    row.appendChild(emailCell);

    const statusCell = document.createElement('td');
    statusCell.textContent = message.status;
    statusCell.className = message.status === 'Success' ? 'success' : 'error';
    row.appendChild(statusCell);

    const timestampCell = document.createElement('td');
    timestampCell.textContent = message.timestamp;
    row.appendChild(timestampCell);

    table.appendChild(row);
});
