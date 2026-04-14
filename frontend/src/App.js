import React, { useState, useEffect } from 'react';
import Senadores from './components/Senadores';
import Diputados from './components/Diputados';
import Configuracion from './components/Configuracion';
import logo from './logo.png';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('senadores');
  useEffect(() => {
    document.title = "H3M1C1CL0";
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <div className="header-logo-container">
          <img src={logo} alt="Logo Reparto Parlamentario" style={{ width: '180px' }} />
        </div>
        <div>
          <h1 className="title-gradient">REPARTO PARLAMENTARIO</h1>
          <p className="subtitle">Simulación de Asignación de Escaños</p>
        </div>
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
        <p>&copy; 2026 Reparto Parlamentario - José Luis Vegas Márquez</p>
        <p>
          📧 josevegas.marquez@gmail.com &nbsp;|&nbsp;
          📞 +51 969783959
        </p>
      </footer>
    </div>
  );
}

export default App;