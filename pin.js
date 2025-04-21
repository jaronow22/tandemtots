let enteredPin = '';

document.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('pin') || '0';
  if (saved !== '0') {
    window.location.href = 'index.html';
  }
  
  document.getElementById('submitPinBtn').disabled = true;
});

document.querySelectorAll('.pin-btn').forEach(button => {
  button.addEventListener('click', function() {
    const val = this.dataset.value;
    
    if (val) {
      if (enteredPin.length < 4) {
        enteredPin += val;
        document.getElementById('pinInput').value = enteredPin;
      }
    } else if (this.id === 'backPinBtn') {
      enteredPin = enteredPin.slice(0, -1);
      document.getElementById('pinInput').value = enteredPin;
    }
    
    document.getElementById('submitPinBtn').disabled = (enteredPin.length !== 4);
  });
});

// Submission handler
document.getElementById('submitPinBtn').addEventListener('click', function() {
  sessionStorage.setItem('pin', enteredPin);
  window.location.href = 'index.html';
});