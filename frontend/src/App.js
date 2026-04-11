import React, { useState } from 'react';
import Senadores from './components/Senadores';
import Diputados from './components/Diputados';
import Configuracion from './components/Configuracion';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('senadores');

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="title-gradient">REPARTO PARLAMENTARIO</h1>
        <p className="subtitle">Sistema de Asignación de Escaños Senior</p>
      </header>
      
      <nav className="tabs">
        <button 
          className={activeTab === 'senadores' ? 'active' : ''} 
          onClick={() => setActiveTab('senadores')}
        >
          Cámara de Senadores
        </button>
        <button 
          className={activeTab === 'diputados' ? 'active' : ''} 
          onClick={() => setActiveTab('diputados')}
        >
          Cámara de Diputados
        </button>
        <button 
          className={activeTab === 'configuracion' ? 'active' : ''} 
          onClick={() => setActiveTab('configuracion')}
        >
          Configuración
        </button>
      </nav>

      <main className="container">
        {activeTab === 'senadores' && <Senadores />}
        {activeTab === 'diputados' && <Diputados />}
        {activeTab === 'configuracion' && <Configuracion />}
      </main>

      <footer>
        <p>&copy; 2026 Reparto Parlamentario - Engine de Alta Precisión</p>
      </footer>
    </div>
  );
}

export default App;