// Ya no usamos DOMContentLoaded ni bloqueamos el script al inicio.
// Las variables se quedan arriba esperando a ser llamadas.
let audioContext;
let analyser;
let microphone;
let dataArray;
let animationId;
let mediaStream;
let running = false;

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function freqToNote(freq) {
  if (!freq || freq <= 0) return "--"; 
  const A4 = 440;
  const semitones = 12 * Math.log2(freq / A4);
  const midi = Math.round(semitones) + 69;
  
  if (midi < 0 || midi > 127) return "--"; 
  
  const note = NOTES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

function startAnalyzer(toggleButton) {
  // Buscamos el canvas dinámicamente cada vez que se presiona el botón
  const canvas = document.getElementById("spectrumCanvas");
  const noteDisplay = document.getElementById("noteDisplay");
  
  if (!canvas) {
    console.error("Error: No se encontró el elemento <canvas>");
    return;
  }
  const ctx = canvas.getContext("2d");

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 8192; 

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaStream = stream;
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      dataArray = new Uint8Array(analyser.frequencyBinCount);

      function draw() {
        if (!audioContext || audioContext.state === "closed") return;

        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barsToDraw = Math.min(dataArray.length, 500); 
        const barWidth = canvas.width / barsToDraw; 
        
        let maxAmp = 0;
        let maxIndex = 0;

        for (let i = 1; i < dataArray.length - 1; i++) {
          if (dataArray[i] > maxAmp) {
            maxAmp = dataArray[i];
            maxIndex = i;
          }
          
          if (i < barsToDraw) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            ctx.fillStyle = "lime";
            ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
          }
        }

        let freqBin = 0;

        if (maxAmp > 110 && maxIndex > 0 && maxIndex < dataArray.length - 1) {
          const y1 = dataArray[maxIndex - 1]; 
          const y2 = dataArray[maxIndex];     
          const y3 = dataArray[maxIndex + 1]; 

          let p = 0;
          const denominador = 2 * (y1 - 2 * y2 + y3);
          if (denominador !== 0) {
            p = (y1 - y3) / denominador;
          }

          const interpolatedIndex = maxIndex + p;
          freqBin = interpolatedIndex * audioContext.sampleRate / analyser.fftSize;

          if (freqBin > 65 && freqBin < 1200) {
            if (noteDisplay) noteDisplay.textContent = `Nota: ${freqToNote(freqBin)} (${freqBin.toFixed(2)} Hz)`;
          } else if (noteDisplay) {
            noteDisplay.textContent = "Nota: --";
          }
        } else if (noteDisplay) {
          noteDisplay.textContent = "Nota: --";
        }

        animationId = requestAnimationFrame(draw);
      }

      draw();
    })
    .catch(err => {
      console.error("Error accediendo al micrófono:", err);
      alert("No se pudo acceder al micrófono. Asegúrate de dar los permisos.");
      running = false;
      toggleButton.textContent = "🎤 Empezar Análisis";
    });
}

function stopAnalyzer() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  const canvas = document.getElementById("spectrumCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  const noteDisplay = document.getElementById("noteDisplay");
  if (noteDisplay) {
    noteDisplay.textContent = "Nota: --";
  }
}

// DELEGACIÓN DE EVENTOS: Escuchamos clics en TODO el documento
document.addEventListener("click", (event) => {
  // Verificamos si el elemento clicado (o su contenedor) es nuestro botón
  if (event.target && event.target.id === "toggleButton") {
    const toggleButton = event.target;
    
    if (!running) {
      startAnalyzer(toggleButton);
      toggleButton.textContent = "⏹️ Detener Análisis";
    } else {
      stopAnalyzer();
      toggleButton.textContent = "🎤 Empezar Análisis";
    }
    running = !running;
  }
});