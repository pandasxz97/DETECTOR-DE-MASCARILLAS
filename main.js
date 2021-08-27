// Coge todos los elementos DOM
const video = document.getElementById('video');
const status = document.getElementById('status');
const loading = document.getElementById('loading');
const label1Button = document.getElementById('label1Button');
const label2Button = document.getElementById('label2Button');
const label1Input = document.getElementById('label1Input');
const label2Input = document.getElementById('label2Input');
const amountOfLabel1Images = document.getElementById('amountOfLabel1Images');
const amountOfLabel2Images = document.getElementById('amountOfLabel2Images');
const train = document.getElementById('train');
const loss = document.getElementById('loss');
const result = document.getElementById('result');
const confidence = document.getElementById('confidence');
const predict = document.getElementById('predict');
const loadModel = document.getElementById('loadModel');
const saveModel = document.getElementById('saveModel');

// Constantes
const DEFAULT_LABEL_1 = 'sin_mascarilla';
const DEFAULT_LABEL_2 = 'con_mascarilla';
const THRESHOLD_TRAINING = 20;

// Variables Globales
let totalLoss = 0;
let isModelReady = false;
let isCustomModelReady = false;
let isVideoReady = false;
let featureExtractor = null;
let classifier = null;
let isTrainingCompleted = false;
let startPredicting = false;

// Función de inicio
const main = () => {
 // Crea una captura de webcam
  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    video.srcObject = stream;
    video.play();
  });

  // Extraiga las funciones ya aprendidas de MobileNet
  featureExtractor = ml5.featureExtractor('MobileNet', modelLoaded);
 // Crea un clasificador nuevo usando esas características
  classifier = featureExtractor.classification(video, videoReady);

  status.textContent = 'Cargando';
  label1Input.textContent = DEFAULT_LABEL_1;
  label2Input.textContent = DEFAULT_LABEL_2;
};

label1Input.onchange = () => {
  label1Button.innerText = label1Input.value || 'Clase 1';
};

label2Input.onchange = () => {
  label2Button.innerText = label2Input.value || 'Clase 2';
};

// Actualizar el estado actual
const updateStatus = () => {
  let text = [];
  if (isVideoReady) text.push('El video está listo');
  if (isModelReady) text.push('Modelo principal cargado');
  if (isCustomModelReady) text.push('Modelo personalizado cargado');
  if (isTrainingCompleted) text.push('Entrenamiento completado');
  if (isTrainingCompleted || isCustomModelReady) text.push('La detección está lista');
  status.textContent = text.join(', ');
};


// Una función que se llamará cuando se haya cargado el modelo
const modelLoaded = () => {
  isModelReady = true;
  updateStatus();
};


// Una función que se llamará cuando el video termine de cargarse
const videoReady = () => {
  isVideoReady = true;
  updateStatus();
};

// Cuando se presiona el botón "label1", agregue el marco actual
// del video con una "etiqueta1" al clasificador
label1Button.onclick = () => {
  const label1 = label1Input.value || DEFAULT_LABEL_1;
  classifier.addImage(label1);
  amountOfLabel1Images.innerText = Number(amountOfLabel1Images.innerText) + 1;
};

// Cuando se presiona el botón "label2", agregue el marco actual
// del video con una "etiqueta2" al clasificador
label2Button.onclick = () => {
  const label2 = label2Input.value || DEFAULT_LABEL_2;
  classifier.addImage(label2);
  amountOfLabel2Images.innerText = Number(amountOfLabel2Images.innerText) + 1;
};

// Cuando se presiona el botón de tren, entrena el clasificador
train.onclick = () => {
  if (
    Number(amountOfLabel1Images.innerText) < THRESHOLD_TRAINING || 
    Number(amountOfLabel2Images.innerText) < THRESHOLD_TRAINING
  ) {
    window.alert(`Los datos de entrenamiento son muy pocos. Agregue el conjunto de entrenamiento al menos ${THRESHOLD_TRAINING} muestras por clase`);
    return;
  }
  isTrainingCompleted = false;
  classifier.train((lossValue) => {
    if (lossValue) {
      totalLoss = lossValue;
      loss.innerHTML = `Perdida: ${totalLoss}`;
    } else {
      loss.innerHTML = `¡Entrenamiento terminado! Pérdida final: ${totalLoss}`;
      isTrainingCompleted = true;
      updateStatus();
    }
  });
};

// Muestra los resultados
const gotResults = (err, results) => {

// Muestra cualquier error
  if (err) {
    console.error(err);
  } else if (results && results[0] && startPredicting) {
    result.innerText = results[0].label;
    confidence.innerText = results[0].confidence;
    classifier.classify(gotResults);
  }
}

// Comience a predecir cuándo se hace clic en el botón de predicción
predict.onclick = () => {
  if (startPredicting) {
    predict.innerText = 'Iniciar Detección!';
    startPredicting = false;
  } else if (isTrainingCompleted || isCustomModelReady) {
    classifier.classify(gotResults);
    startPredicting = true;
    predict.innerText = 'Parar Detección!';
  } else {
    window.alert('¡Entrene el modelo o cargue el existente!');
  }
};


// Guardar modelo actual
saveModel.onclick = () => {
  featureExtractor.save((err, result) => {
    if (err) {
      window.alert('No se pudo guardar el modelo');
      console.error(err);
    }
  });
};

// Cargar modelo existente
loadModel.onclick = () => {
  path = 'model/model.json';
  featureExtractor.load(path, (err, result) => {
    if (err) {
      window.alert('No se pudo cargar el modelo personalizado');
      console.error(err);
    }
    isCustomModelReady = true;
    updateStatus();
  });
}

// Iniciar programa
main();