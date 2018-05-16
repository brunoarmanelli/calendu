// Inicialização do Firebase
var config = {
  apiKey: "AIzaSyC3J9vLHCgOfQ2g_24xdcbPf4PZ7U16QMI",
  authDomain: "calendu-8e76e.firebaseapp.com",
  databaseURL: "https://calendu-8e76e.firebaseio.com",
  projectId: "calendu-8e76e",
  storageBucket: "calendu-8e76e.appspot.com",
  messagingSenderId: "11475928733"
};
firebase.initializeApp(config);

//Helper criado para o handlebars que ordena as datas no momento de escrevê-las.
Handlebars.registerHelper('eachSort', function (obj, options) {
  var dados = [];
  var result = '';

  //Itera sobre o objeto contendo os dados de cada prova e cria um vetor com esses dados.
  for (var key in obj) {
    dados.push({
      'data': obj[key].data,
    });
  }

  //Ordena o vetor em ordem crescente
  dados.sort(function (a, b) {
    return a.data - b.data;
  });

  //Converte as datas de milissegundos para o formato adequado e gera o template.
  for (var i = 0; i < dados.length; i++) {
    var miliseg = dados[i].data;
    var dataStr = new Date(miliseg);
    var opcoes = { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    var dataLocal = dataStr.toLocaleString('pt-BR', opcoes);
    dados[i].data = dataLocal;
    result += options.fn(dados[i]);
    
  }

  return result;
});

//Checa se a autenticação foi feita e gera o template com os dados do usuario.
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    var uid = user.uid;
    var boxTemplate = $("#template").html();
    var compiledBoxTemplate = Handlebars.compile(boxTemplate);
    var dbRef = firebase.database().ref().child('users/' + uid + '/');
    dbRef.on('value', function (snap) {
      //Se existir dados para o usuario no banco de dados, gera o template.
      if (snap.val()) {
        $("#accordion").html(compiledBoxTemplate(snap.val()));
      }
      //Caso contrário, cria uma entrada para o usuário no banco de dados.
      else {
        firebase.database().ref('users').child(uid).set('0');
        firebase.database().ref('users').child(uid).child('disciplinas').set('0');
      }
    });
  }
  else {
    window.location = 'index.html';
  }
});


//Salvar nova disciplina
var database = firebase.database().ref();
var salvarDisciplina = function (a) {
  a.preventDefault();
  var usuario = firebase.auth().currentUser;
  var nomeDisc = $('#nomeDisc').val();
  var diaSemana = $('#diaSemana').val();
  var horario = $('#horario').val();
  var dados = {
    "nome": nomeDisc,
    "dias": diaSemana,
    "horario": horario,
    "provas": "",
    "trabalhos": "",
    "exercicios": "",
    "eventos": "",
    "chave": ""
  }
  var chave = database.child('users/' + usuario.uid + '/disciplinas/').push(dados).key;
  firebase.database().ref('users/' + usuario.uid + '/disciplinas/' + chave).child('chave').set(chave);
  $("#novaDiscForm")[0].reset();
  $('#addDisc').modal('hide');
};
$(document).ready(function () {
  $("#novaDiscForm").submit(salvarDisciplina);
});


//Salvar nova prova
var database = firebase.database().ref();
var chaveDisciplina;
function getKey() {
  chaveDisciplina = $(this).data('key');
}
$(document).on('click', '#adicionar-prova', getKey);
var salvarProva = function (a) {
  a.preventDefault();
  var usuario = firebase.auth().currentUser;
  var dataProva = $('#dataProva').val();
  var horaProva = $('#horaProva').val();
  var dataHora = dataProva + 'T' + horaProva;
  var dataObj = new Date(dataHora);
  var dataHoraFormat = Date.parse(dataObj);
  var dadosProva = {
    "data": dataHoraFormat
  }
  database.child('users/' + usuario.uid + '/disciplinas/' + chaveDisciplina + '/provas/').push(dadosProva);
  $("#novaProvaForm")[0].reset();
  $('#addProva').modal('hide');
};
$(document).on('submit', '#novaProvaForm', salvarProva);


//Salvar novo trabalho
function getKey() {
  chaveDisciplina = $(this).data('key');
}
$(document).on('click', '#adicionar-trabalho', getKey);
var salvarTrabalho = function (a) {
  a.preventDefault();
  var usuario = firebase.auth().currentUser;
  var dataTrabalho = $('#dataTrabalho').val();
  var horaTrabalho = $('#horaTrabalho').val();
  var dadosTrabalho = {
    "data": dataTrabalho,
    "horario": horaTrabalho
  }
  database.child('users/' + usuario.uid + '/disciplinas/' + chaveDisciplina + '/trabalhos/').push(dadosTrabalho);
  $("#novoTrabalhoForm")[0].reset();
  $('#addTrabalho').modal('hide');
};
$(document).on('submit', '#novoTrabalhoForm', salvarTrabalho);


//Salvar novo exercício
function getKey() {
  chaveDisciplina = $(this).data('key');
}
$(document).on('click', '#adicionar-exercicio', getKey);
var salvarExercicio = function (a) {
  a.preventDefault();
  var usuario = firebase.auth().currentUser;
  var dataExercicio = $('#dataExercicio').val();
  var horaExercicio = $('#horaExercicio').val();
  var dadosExercicio = {
    "data": dataExercicio,
    "horario": horaExercicio
  }
  database.child('users/' + usuario.uid + '/disciplinas/' + chaveDisciplina + '/exercicios/').push(dadosExercicio);
  $("#novoExercicioForm")[0].reset();
  $('#addExercicio').modal('hide');
};
$(document).on('submit', '#novoExercicioForm', salvarExercicio);


//Remover Disciplina
var removerDisciplina = function (b) {
  b.preventDefault();
  var usuario = firebase.auth().currentUser;
  var key = $(this).data('key');
  if (confirm('Deseja excluir a disciplina? Esta ação não pode ser desfeita.')) {
    firebase.database().ref('users/' + usuario.uid + '/disciplinas/').child(key).remove();
  }
}
$(document).on('click', '.remover-disciplina', removerDisciplina);


//Logout de Usuario
function logout_user() {
  firebase.auth().signOut().then(function () {
    window.location = 'index.html';
  }).catch(function (error) {
    console.log("Erro");
  });
}
$('#logout').on('click', logout_user);

