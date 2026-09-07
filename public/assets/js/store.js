/* store.js — adapters de armazenamento da PageForge AI.
   V1: localStorage. A interface (list/get/upsert/remove/clear) é estável para
   trocar por um backend/nuvem depois sem mexer na interface. */
(function (global) {
  'use strict';

  function makeStore(key, idField) {
    function readAll() {
      try {
        var raw = localStorage.getItem(key);
        var arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }
    function writeAll(arr) {
      try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
    }
    return {
      key: key,
      list: function (filter) {
        var arr = readAll();
        if (typeof filter === 'function') arr = arr.filter(filter);
        else if (filter && typeof filter === 'object') {
          arr = arr.filter(function (x) {
            return Object.keys(filter).every(function (k) { return x[k] === filter[k]; });
          });
        }
        return arr;
      },
      get: function (id) {
        return readAll().filter(function (x) { return x[idField] === id; })[0] || null;
      },
      upsert: function (item) {
        if (!item || !item[idField]) return null;
        var arr = readAll();
        var i = arr.findIndex(function (x) { return x[idField] === item[idField]; });
        item.atualizado = new Date().toISOString();
        if (i === -1) { item.criado = item.criado || item.atualizado; arr.unshift(item); }
        else { arr[i] = Object.assign({}, arr[i], item); }
        writeAll(arr);
        return item;
      },
      upsertMany: function (items) {
        var arr = readAll();
        (items || []).forEach(function (item) {
          if (!item || !item[idField]) return;
          var i = arr.findIndex(function (x) { return x[idField] === item[idField]; });
          item.atualizado = new Date().toISOString();
          if (i === -1) { item.criado = item.criado || item.atualizado; arr.unshift(item); }
          else { arr[i] = Object.assign({}, arr[i], item); }
        });
        writeAll(arr);
        return arr.length;
      },
      remove: function (id) {
        writeAll(readAll().filter(function (x) { return x[idField] !== id; }));
      },
      clear: function () { writeAll([]); },
      count: function () { return readAll().length; }
    };
  }

  // objeto único (chave -> objeto). Base para settings e para o estado da UI.
  function makeDoc(key, defaults) {
    return {
      key: key,
      get: function () {
        var v;
        try { v = JSON.parse(localStorage.getItem(key)); } catch (e) { v = null; }
        return Object.assign({}, defaults || {}, v && typeof v === 'object' ? v : {});
      },
      set: function (patch) {
        var next = Object.assign({}, this.get(), patch || {});
        try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) {}
        return next;
      }
    };
  }

  // settings: perfil + prospecção + páginas + comercial + publicação
  var settings = makeDoc('pageforge:settings:v1', {
    // MEU PERFIL
    assinaturaNome: '', assinaturaEmpresa: '', assinaturaEmail: '', assinaturaWhatsapp: '',
    assinaturaApresentacao: '', assinaturaComercial: '',
    // PROSPECÇÃO
    prospeccaoNicho: '', prospeccaoRegiao: '', prospeccaoQtd: '10',
    // PÁGINAS
    paginaIdioma: 'pt-BR', paginaCta: '', paginaScroll: 'static',
    // COMERCIAL
    precoPadrao: '', moeda: 'BRL', prazoPadrao: '', formaPagamento: '',
    observacoesComerciais: '', assinaturaProposta: '',
    // PUBLICAÇÃO
    dominio: '', dominioDemo: '',
    // CONTRATO
    contratanteNome: '', contratanteDoc: '', contratanteEndereco: '', contratanteCidade: ''
  });

  // ui: estado local da interface (onboarding, dicas dispensadas, última rota)
  var ui = makeDoc('pageforge:ui:v1', {
    onboardingDone: false, onboardingHideForever: false, lastRoute: ''
  });

  global.PFStore = {
    leads: makeStore('pageforge:leads:v1', 'slug'),
    projects: makeStore('pageforge:projects:v1', 'id'),
    settings: settings,
    ui: ui,
    doc: makeDoc,
    make: makeStore
  };
})(window);
