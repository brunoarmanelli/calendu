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
      'diaSemana': obj[key].diaSemana,
      'detalhes': obj[key].detalhes,
      'chave': key,
      'chaveLista': obj[key].chaveLista,
      'tipo': obj[key].tipo,
      'materia': obj[key].materia,
      'mesDia': obj[key].mesDia
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

Handlebars.registerHelper('eachSortGroup', function (obj, options) {
  var dados = [];
  var result = '';

  //Itera sobre o objeto contendo os dados de cada prova e cria um vetor com esses dados.
  for (var key in obj) {
    dados.push({
      'data': obj[key].data,
      'diaSemana': obj[key].diaSemana,
      'detalhes': obj[key].detalhes,
      'chave': key,
      'tipo': obj[key].tipo,
      'materia': obj[key].materia,
      'mesDia': obj[key].mesDia
    });
  }

  //Ordena o vetor em ordem crescente
  dados.sort(function (a, b) {
    return a.data - b.data;
  });

  function addZero(k) {
    if (k < 10) {
      k = "0" + k;
    }
    return k;
  }

  //Converte as datas de milissegundos para o formato adequado e gera o template.
  for (var i = 0; i < dados.length; i++) {
    var miliseg = dados[i].data;
    var dataStr = new Date(miliseg);
    var hora = addZero(dataStr.getHours());
    var minutos = addZero(dataStr.getMinutes());
    var opcoes = { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    var dataLocal = dataStr.toLocaleString('pt-BR', opcoes);
    dados[i].data = dataLocal;
    dados[i].milissegundos = miliseg;
    dados[i].hora = hora + ":" + minutos;
  }

  //Remove os dados de datas que já passaram
  var msAgora = new Date();
  var dadosAtuais = [];
  for (i = 0; i < dados.length; i++) {
    if (dados[i].milissegundos > msAgora) {
      dadosAtuais.push(dados[i]);
    }
  }

  var groups = _.groupBy(dadosAtuais, 'mesDia');
  for (var keyGroup in groups) {
    if (groups.hasOwnProperty(keyGroup)) {
      result += options.fn({ key: keyGroup, value: groups[keyGroup] });
    }
  }
  return result;
});


Handlebars.registerHelper('compare', function (lvalue, rvalue, options) {

  if (arguments.length < 3)
    throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

  var operator = options.hash.operator || "==";

  var operators = {
    '==': function (l, r) { return l == r; },
    '===': function (l, r) { return l === r; },
    '!=': function (l, r) { return l != r; },
    '<': function (l, r) { return l < r; },
    '>': function (l, r) { return l > r; },
    '<=': function (l, r) { return l <= r; },
    '>=': function (l, r) { return l >= r; },
    'typeof': function (l, r) { return typeof l == r; }
  }

  if (!operators[operator])
    throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);

  var result = operators[operator](lvalue, rvalue);

  if (result) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }

});

//Checa se a autenticação foi feita e gera o template com os dados do usuario.
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    var uid = user.uid;
    var boxTemplate = $("#template").html();
    var calenTemplate = $("#template-calendario").html();
    var compiledBoxTemplate = Handlebars.compile(boxTemplate);
    var compiledCalenTemplate = Handlebars.compile(calenTemplate);
    var dbRef = firebase.database().ref().child('users/' + uid + '/');
    dbRef.on('value', function (snap) {
      //Se existir dados para o usuario no banco de dados, gera o template.
      if (snap.val()) {
        $("#accordion").html(compiledBoxTemplate(snap.val()));
        $('#container-calendario').html(compiledCalenTemplate(snap.val()));
      }
      //Caso contrário, cria uma entrada para o usuário no banco de dados.
      else {
        firebase.database().ref('users').child(uid).set('0');
        firebase.database().ref('users').child(uid).child('disciplinas').set('');
        firebase.database().ref('users').child(uid).child('deveres').set('');
      }
    });

  }
  else {
    //Se o usuário não estiver logado, redireciona para a página inicial.
    window.location = 'index.html';
  }
});

//Cria inputs de horário de início e fim para cada dia da semana selecionado no formulário de adicionar disciplina
var wrapper = $("#horarioDiaSemana");
$(".weekday").change(function () {
  if ($(this).is(':checked')) {
    $(wrapper).append('<div id="containerHora' + this.name + '"style="margin-bottom: 10px">' + '<label for="horario" class="horario' + this.name + '">' + this.name + '</label>' + '<br>Início: <input type="time" class="horario' + this.name + '" id="inputInicio' + this.name + '" required>' + '&nbspFim: <input type="time" class="horario' + this.name + '" id="inputFim' + this.name + '" required><hr></div>');
  }
  else {
    $('#containerHora' + this.name).remove();
  }
});

//Salvar nova disciplina
var database = firebase.database().ref();
var salvarDisciplina = function (a) {
  a.preventDefault();
  var usuario = firebase.auth().currentUser;
  var nomeDisc = $('#nomeDisc').val();
  var diaSemana = [];

  //Checa quais checkboxes de dias da semana estão marcados e salva um valor no vetor.
  if ($('#weekday-mon').is(":checked")) {
    diaSemana.push({
      'dia': 1,
      'inicio': $('#inputInicioSegunda').val(),
      'fim': $('#inputFimSegunda').val()
    });
    $('#containerHoraSegunda').remove();
  }
  if ($('#weekday-tue').is(":checked")) {
    diaSemana.push({
      'dia': 2,
      'inicio': $('#inputInicioTerça').val(),
      'fim': $('#inputFimTerça').val()
    });
    $('#containerHoraTerça').remove();
  }
  if ($('#weekday-wed').is(":checked")) {
    diaSemana.push({
      'dia': 3,
      'inicio': $('#inputInicioQuarta').val(),
      'fim': $('#inputFimQuarta').val()
    });
    $('#containerHoraQuarta').remove();
  }
  if ($('#weekday-thu').is(":checked")) {
    diaSemana.push({
      'dia': 4,
      'inicio': $('#inputInicioQuinta').val(),
      'fim': $('#inputFimQuinta').val()
    });
    $('#containerHoraQuinta').remove();
  }
  if ($('#weekday-fri').is(":checked")) {
    diaSemana.push({
      'dia': 5,
      'inicio': $('#inputInicioSexta').val(),
      'fim': $('#inputFimSexta').val()
    });
    $('#containerHoraSexta').remove();
  }
  if ($('#weekday-sat').is(":checked")) {
    diaSemana.push({
      'dia': 6,
      'inicio': $('#inputInicioSábado').val(),
      'fim': $('#inputFimSábado').val()
    });
    $('#containerHoraSábado').remove();
  }
  if ($('#weekday-sun').is(":checked")) {
    diaSemana.push({
      'dia': 0,
      'inicio': $('#inputInicioDomingo').val(),
      'fim': $('#inputFimDomingo').val()
    });
    $('#containerHoraDomingo').remove();
  }

  //Ordena o vetor em ordem crescente
  function ordenarCrescente(a, b) {
    return a.dia - b.dia;
  }
  diaSemana.sort(ordenarCrescente);

  //Itera sobre cada elemento do vetor e salva o dia da semana correspondente ao número salvo no vetor.
  for (var i = 0; i < diaSemana.length; i++) {
    if (diaSemana[i].dia == 0) {
      diaSemana[i].dia = "Domingo";
    }
    else if (diaSemana[i].dia == 1) {
      diaSemana[i].dia = "Segunda";
    }
    else if (diaSemana[i].dia == 2) {
      diaSemana[i].dia = "Terça";
    }
    else if (diaSemana[i].dia == 3) {
      diaSemana[i].dia = "Quarta";
    }
    else if (diaSemana[i].dia == 4) {
      diaSemana[i].dia = "Quinta";
    }
    else if (diaSemana[i].dia == 5) {
      diaSemana[i].dia = "Sexta";
    }
    else if (diaSemana[i].dia == 6) {
      diaSemana[i].dia = "Sábado";
    }
  }

  var dados = {
    "nome": nomeDisc,
    "dias": diaSemana,
    "provas": "",
    "trabalhos": "",
    "eventos": "",
    "chave": ""
  }
  //Salva os dados da disciplina no firebase
  var chave = database.child('users/' + usuario.uid + '/disciplinas/').push(dados).key;
  firebase.database().ref('users/' + usuario.uid + '/disciplinas/' + chave).child('chave').set(chave);

  //Reseta os campos do formulário e fecha o modal do formulário
  $("#novaDiscForm")[0].reset();
  $('#addDisc').modal('hide');
};
$(document).ready(function () {
  $("#novaDiscForm").submit(salvarDisciplina);
});


//Salvar nova prova
var database = firebase.database().ref();
var chaveDisciplina;
//Pega o valor da chave correspondente à disciplina
function getKey() {
  chaveDisciplina = $(this).data('key');
  nomeMateria = $(this).data('materia');
}
$(document).on('click', '#adicionar-prova', getKey);
//Função que salva os dados das provas no banco de dados.
var salvarProva = function (a) {
  a.preventDefault();
  var usuario = firebase.auth().currentUser;
  var dataProva = $('#dataProva').val();
  var horaProva = $('#horaProva').val();
  //Concatena as strings relacionadas à data e horario da prova, cria um objeto Date e converte os dados para milissegundos.
  var dataHora = dataProva + 'T' + horaProva;
  var dataObj = new Date(dataHora);
  var numDiaSemana = dataObj.getDay();
  if (numDiaSemana == 0) {
    numDiaSemana = "Domingo";
  }
  else if (numDiaSemana == 1) {
    numDiaSemana = "Segunda";
  }
  else if (numDiaSemana == 2) {
    numDiaSemana = "Terça";
  }
  else if (numDiaSemana == 3) {
    numDiaSemana = "Quarta";
  }
  else if (numDiaSemana == 4) {
    numDiaSemana = "Quinta";
  }
  else if (numDiaSemana == 5) {
    numDiaSemana = "Sexta";
  }
  else if (numDiaSemana == 6) {
    numDiaSemana = "Sábado";
  }
  var dataHoraFormat = Date.parse(dataObj);
  var dataStr = new Date(dataHoraFormat);
  var opcs = { month: 'long', day: 'numeric' };
  var mesDiaLocal = dataStr.toLocaleString('pt-BR', opcs);
  var detalhesProva = $("#detalhesProva").val();
  var dadosProva = {
    "data": dataHoraFormat,
    "diaSemana": numDiaSemana,
    "detalhes": detalhesProva,
    "materia": nomeMateria,
    "chaveDisciplina": chaveDisciplina,
    "tipo": "Prova",
    "mesDia": mesDiaLocal
  };
  var chaveLista = database.child('users/' + usuario.uid + '/deveres/').push(dadosProva).key;
  dadosProva.chaveLista = chaveLista;
  database.child('users/' + usuario.uid + '/disciplinas/' + chaveDisciplina + '/provas/').push(dadosProva);
  $("#novaProvaForm")[0].reset();
  $('#addProva').modal('hide');

};
$(document).on('submit', '#novaProvaForm', salvarProva);


//Salvar novo trabalho
$(document).on('click', '#adicionar-trabalho', getKey);
var salvarTrabalho = function (a) {
  a.preventDefault();
  var usuario = firebase.auth().currentUser;
  var dataTrabalho = $('#dataTrabalho').val();
  var horaTrabalho = $('#horaTrabalho').val();
  //Concatena as strings relacionadas à data e horario do trabalho
  var dataHora = dataTrabalho + 'T' + horaTrabalho;
  //Gera um objeto Date
  var dataObj = new Date(dataHora);
  var numDiaSemana = dataObj.getDay();
  if (numDiaSemana == 0) {
    numDiaSemana = "Domingo";
  }
  else if (numDiaSemana == 1) {
    numDiaSemana = "Segunda";
  }
  else if (numDiaSemana == 2) {
    numDiaSemana = "Terça";
  }
  else if (numDiaSemana == 3) {
    numDiaSemana = "Quarta";
  }
  else if (numDiaSemana == 4) {
    numDiaSemana = "Quinta";
  }
  else if (numDiaSemana == 5) {
    numDiaSemana = "Sexta";
  }
  else if (numDiaSemana == 6) {
    numDiaSemana = "Sábado";
  }
  //Converte a string de data para timestamp em milissegundo
  var dataHoraFormat = Date.parse(dataObj);
  var dataStr = new Date(dataHoraFormat);
  var opcs = { month: 'long', day: 'numeric' };
  var mesDiaLocal = dataStr.toLocaleString('pt-BR', opcs);
  var detalhesTrabalho = $("#detalhesTrabalho").val();
  var dadosTrabalho = {
    "data": dataHoraFormat,
    "diaSemana": numDiaSemana,
    "detalhes": detalhesTrabalho,
    "materia": nomeMateria,
    "chaveDisciplina": chaveDisciplina,
    "tipo": "Tarefa",
    "mesDia": mesDiaLocal
  }
  var chaveLista = database.child('users/' + usuario.uid + '/deveres/').push(dadosTrabalho).key;
  dadosTrabalho.chaveLista = chaveLista;
  database.child('users/' + usuario.uid + '/disciplinas/' + chaveDisciplina + '/trabalhos/').push(dadosTrabalho);
  $("#novoTrabalhoForm")[0].reset();
  $('#addTrabalho').modal('hide');
};
$(document).on('submit', '#novoTrabalhoForm', salvarTrabalho);


//Remover Disciplina
var removerDisciplina = function (b) {
  b.preventDefault();
  var usuario = firebase.auth().currentUser;
  var key = $(this).data('key');
  if (confirm('Deseja excluir a disciplina? Esta ação não pode ser desfeita.')) {
    firebase.database().ref('users/' + usuario.uid + '/disciplinas/').child(key).remove();
    var deveresRef = firebase.database().ref().child('users/' + usuario.uid + '/deveres');
    deveresRef.on('value', function (snapshot) {
      var objetoDeveres = snapshot.val();
      for (var keyDever in objetoDeveres) {
        if (objetoDeveres[keyDever].chaveDisciplina == key) {
          firebase.database().ref('users/' + usuario.uid + '/deveres/').child(keyDever).remove();
        }
      }
    })
  }
}
$(document).on('click', '.remover-disciplina', removerDisciplina);


//Remover Prova
var removerProva = function (b) {
  b.preventDefault();
  var usuario = firebase.auth().currentUser;
  var keyDisc = $(this).closest('#footer-prova').data('key');
  var keyProva = $(this).data('key');
  var keyLista = $(this).data('chave-lista');
  if (confirm('Deseja excluir a prova? Esta ação não pode ser desfeita.')) {
    firebase.database().ref('users/' + usuario.uid + '/disciplinas/' + keyDisc + '/provas/').child(keyProva).remove();
    firebase.database().ref('users/' + usuario.uid + '/deveres/').child(keyLista).remove();
  }

}
$(document).on('click', '#remover-prova', removerProva);


//Remover Tarefa
var removerTarefa = function (b) {
  b.preventDefault();
  var usuario = firebase.auth().currentUser;
  var keyDisc = $(this).closest('#footer-trabalho').data('key');
  var keyTrabalho = $(this).data('key');
  var keyLista = $(this).data('chave-lista');
  if (confirm('Deseja excluir a tarefa? Esta ação não pode ser desfeita.')) {
    firebase.database().ref('users/' + usuario.uid + '/disciplinas/' + keyDisc + '/trabalhos/').child(keyTrabalho).remove();
    firebase.database().ref('users/' + usuario.uid + '/deveres/').child(keyLista).remove();
  }

}
$(document).on('click', '#remover-trabalho', removerTarefa);


//Logout de Usuario
function logout_user() {
  firebase.auth().signOut().then(function () {
    window.location = 'index.html';
  }).catch(function (error) {
    console.log("Erro");
  });
}
$('#logout').on('click', logout_user);


//Limpa os formulário de adicionar prova e tarefas caso eles sejam fechados
$('#addProva').on('hidden.bs.modal', function (e) {
  $(this).find('#novaProvaForm')[0].reset();
  $('.contCaracterProva').html("");
});
$('#addTrabalho').on('hidden.bs.modal', function (e) {
  $(this).find('#novoTrabalhoForm')[0].reset();
  $('.contCaracterTrab').html("");
});

//Contador de caracteres para o campo de detalhes de provas e tarefas
$('textarea').on("input", function () {
  var maxlength = $(this).attr("maxlength");
  var currentLength = $(this).val().length;
  var caracterRestante = maxlength - currentLength;
  if (this.id == 'detalhesProva') {
    if (caracterRestante > 1) {
      $('.contCaracterProva').html(caracterRestante + " caracteres restantes");
    }
    else {
      $('.contCaracterProva').html(caracterRestante + " caractere restante");
    }
  }
  else if (this.id == 'detalhesTrabalho') {
    if (caracterRestante > 1) {
      $('.contCaracterTrab').html(caracterRestante + " caracteres restantes");
    }
    else {
      $('.contCaracterTrab').html(caracterRestante + " caractere restante");
    }
  }

});