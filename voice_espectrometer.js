function initSpectrometer() {
  const toggleButton = document.getElementById("toggleButton");
  const canvas = document.getElementById("spectrumCanvas");
  const ctx = canvas.getContext("2d");
  const noteDisplay = document.getElementById("noteDisplay");

  let audioContext;
  let analyser;
  let microphone;
  let dataArray;
  let animationId;
  let mediaStream;

  const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  function freqToNote(freq) {
    if (!freq || freq <= 0) return "--"; 
    const A4 = 440;
    const semitones = 12 * Math.log2(freq / A4);
    const midi = Math.round(semitones) + 69;
    
    if (midi < 0) return "--"; 
    
    const note = NOTES[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${note}${octave}`;
  }

  function startAnalyzer() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    
    // Mantenemos una resolución alta
    analyser.fftSize = 16384; 

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaStream = stream;
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        dataArray = new Uint8Array(analyser.frequencyBinCount);

        function draw() {
          analyser.getByteFrequencyData(dataArray);

          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / dataArray.length) * 10; 
          let maxAmp = 0;
          let maxIndex = 0;

          // Buscar el índice con la máxima amplitud
          // Empezamos en 1 y terminamos un índice antes para asegurar que existen vecinos
          for (let i = 1; i < dataArray.length - 1; i++) {
            if (dataArray[i] > maxAmp) {
              maxAmp = dataArray[i];
              maxIndex = i;
            }
            
            const x = i * barWidth;
            if (x < canvas.width) {
              const barHeight = dataArray[i];
              ctx.fillStyle = "lime";
              ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            }
          }

          let freqBin = 0;

          // Aplicar la interpolación cuadrática solo si hay suficiente volumen
          if (maxAmp > 100 && maxIndex > 0 && maxIndex < dataArray.length - 1) {
            const y1 = dataArray[maxIndex - 1]; // Vecino izquierdo
            const y2 = dataArray[maxIndex];     // Pico discreto
            const y3 = dataArray[maxIndex + 1]; // Vecino derecho

            // Desfase 'p' para encontrar el vértice de la parábola
            let p = 0;
            const denominador = 2 * (y1 - 2 * y2 + y3);
            if (denominador !== 0) {
                p = (y1 - y3) / denominador;
            }

            // Índice exacto interpolado
            const interpolatedIndex = maxIndex + p;
            
            // Frecuencia final de alta precisión
            freqBin = interpolatedIndex * audioContext.sampleRate / analyser.fftSize;

            // Filtrar ruido de bajas frecuencias
            if (freqBin > 50) {
              noteDisplay.textContent = `Nota: ${freqToNote(freqBin)} (${freqBin.toFixed(2)} Hz)`;
            } else {
              noteDisplay.textContent = "Nota: --";
            }
          } else {
            noteDisplay.textContent = "Nota: --";
          }

          animationId = requestAnimationFrame(draw);
        }

        draw();
      })
      .catch(err => {
        console.error("Error accediendo al micrófono:", err);
        alert("No se pudo acceder al micrófono.");
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

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    noteDisplay.textContent = "Nota: --";
  }

  let running = false;
  toggleButton.addEventListener("click", () => {
    if (!running) {
      startAnalyzer();
      toggleButton.textContent = "⏹️ Detener Análisis";
    } else {
      stopAnalyzer();
      toggleButton.textContent = "🎤 Empezar Análisis";
    }
    running = !running;
  });
}
