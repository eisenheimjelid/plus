import { test, describe, it, mock } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import appHandlers from '../app.js';

describe('Pruebas Unitarias - Slack Plus', () => {
    
    it('debería retornar 200 y el mensaje correcto', async () => {
        const app = express();
        app.get('/', appHandlers.handleGet);

        const response = await request(app).get('/');
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.text, "It works! However, this app only accepts POST requests for now.");
    });

    // Ejemplo de Mock nativo de Node.js 24
    it('ejemplo de mock de función interna', (t) => {
        const fakeFunction = t.mock.fn(() => "valor simulado");
        assert.strictEqual(fakeFunction(), "valor simulado");
        assert.strictEqual(fakeFunction.mock.calls.length, 1);
    });
});
