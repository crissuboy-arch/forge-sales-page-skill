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

  // settings: um único objeto (assinatura, contratante, padrões comerciais)
  var SETTINGS_KEY = 'pageforge:settings:v1';
  var settings = {
    get: function () {
      try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; }
    },
    set: function (patch) {
      var cur = settings.get();
      var next = Object.assign({}, cur, patch || {});
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    }
  };

  global.PFStore = {
    leads: makeStore('pageforge:leads:v1', 'slug'),
    projects: makeStore('pageforge:projects:v1', 'id'),
    settings: settings,
    make: makeStore
  };
})(window);
