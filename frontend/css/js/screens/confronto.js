<!-- ===================== TELA CONFRONTO AO VIVO ===================== -->
<section id="screenConfronto" style="display:none;">
  <div class="page">
    <div class="panel">

      <div class="row" style="justify-content:space-between;">
        <h2 style="margin:0;">Confronto (Ao vivo)</h2>
        <button id="btnVoltarClube" class="secondary">⬅ Voltar</button>
      </div>

      <!-- Card seleção liga/adversário -->
      <div class="card">
        <div class="row" style="justify-content:space-between; align-items:flex-end;">
          <div>
            <div class="muted" style="font-size:13px;">Liga</div>
            <div style="font-weight:1000;" id="confrontoLiga">—</div>
          </div>

          <div class="row">
            <select id="confrontoAdvTime"></select>
            <button id="btnIniciarLive">Carregar confronto</button>
          </div>
        </div>

        <div class="status muted" style="margin-top:10px;">
          Simulação: <b>90 minutos</b> (2 tempos de 45) • cada tempo dura <b>6 segundos</b> (total 12s)
        </div>
      </div>

      <!-- Card placar / relogio -->
      <div class="card">
        <div class="topMatch">
          <div class="teamBox">
            <img id="logoMandante" src="" alt="logo mandante"/>
            <div>
              <div class="muted" style="font-size:12px;">Seu clube</div>
              <div class="nm" id="nomeMandante">—</div>
            </div>
          </div>

          <div style="text-align:center;">
            <div class="scoreBig" id="placarLive">0 x 0</div>
            <div class="clock" id="clockLive">00:00 • 1º tempo</div>
          </div>

          <div class="teamBox" style="justify-content:flex-end;">
            <div style="text-align:right;">
              <div class="muted" style="font-size:12px;">Adversário</div>
              <div class="nm" id="nomeVisitante">—</div>
            </div>
            <img id="logoVisitante" src="" alt="logo visitante"/>
          </div>
        </div>
      </div>

      <!-- ✅ TÁTICA AO VIVO -->
      <div class="card">
        <div class="row" style="justify-content:space-between;">
          <div>
            <div style="font-weight:1000; font-size:18px;">🎮 Tática Ao Vivo</div>
            <div class="muted" style="font-size:12px; margin-top:4px;">
              90 minutos simulados • 2 tempos (45+45) • cada tempo dura 6 segundos
            </div>
          </div>

          <div class="pill">
            <b>Tática:</b>
            <span id="tacticLabel" class="muted">Equilibrado</span>
          </div>
        </div>

        <div style="height:12px;"></div>

        <div class="row">
          <button id="tacDef" class="secondary">🛡️ Defender</button>
          <button id="tacEq" class="secondary">⚖️ Equilibrado</button>
          <button id="tacAtk">🔥 Atacar</button>

          <button id="btnStart12s" style="margin-left:auto;">⏱️ Iniciar partida (12s)</button>
        </div>

        <div class="status muted" style="margin-top:10px;">
          Dica: <b>Atacar</b> aumenta chance de gol, mas também aumenta chance de sofrer contra-ataque.
        </div>
      </div>

      <!-- Campo + painéis -->
      <div class="matchGrid">
        <div class="pitch">
          <div class="centerLine"></div>
          <div class="midCircle"></div>

          <div class="playersOnPitch">
            <div class="half">
              <div class="halfTitle" id="halfTopTitle">Mandante</div>
              <div class="pRow" id="pitchMandante"></div>
            </div>

            <div class="half">
              <div class="halfTitle" id="halfBottomTitle">Visitante</div>
              <div class="pRow" id="pitchVisitante"></div>
            </div>
          </div>
        </div>

        <div class="sidePanel">
          <div class="listBox">
            <h3>Escalações</h3>
            <div class="smallNote">Os 11 melhores disponíveis (sem lesão) entram como titulares.</div>

            <div class="lineup">
              <div class="lineupCol">
                <b id="lineupTitleM">—</b>
                <div id="lineupMandante"></div>
              </div>
              <div class="lineupCol">
                <b id="lineupTitleV">—</b>
                <div id="lineupVisitante"></div>
              </div>
            </div>
          </div>

          <div class="listBox">
            <h3>Súmula</h3>
            <div class="smallNote">Eventos vão aparecendo conforme o tempo passa.</div>
            <div class="sumula" id="sumulaBox">
              <div class="muted">Aguardando início da partida...</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</section>
