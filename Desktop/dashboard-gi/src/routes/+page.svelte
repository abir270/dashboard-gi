<script>
  import { supabase } from '$lib/supabase'
  import { onMount } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  Chart.register(...registerables)

  let taux_reussite = $state(0)
  let taux_assiduite = $state(0)
  let occupation = $state(0)
  let satisfaction = $state(0)

  let canvasReussite
  let canvasSatisfaction

  onMount(async () => {
    const { data: res } = await supabase
      .from('resultats_examens')
      .select('admis, session_admission, note_rattrapage')
    if (res && res.length > 0) {
      const admis = res.filter(r => r.admis).length
      taux_reussite = Math.round((admis / res.length) * 100)
    }

    const { data: abs } = await supabase
      .from('absences_etudiants')
      .select('nb_justifiees, nb_injustifiees')
    if (abs && abs.length > 0) {
      const total = abs.reduce((s, a) => s + a.nb_justifiees + a.nb_injustifiees, 0)
      const injust = abs.reduce((s, a) => s + a.nb_injustifiees, 0)
      taux_assiduite = Math.round(100 - (injust / total) * 100)
    }

    const { data: charge } = await supabase
      .from('charge_permanents')
      .select('heures_statutaires, heures_realisees')
    if (charge && charge.length > 0) {
      const stat = charge.reduce((s, c) => s + c.heures_statutaires, 0)
      const real = charge.reduce((s, c) => s + c.heures_realisees, 0)
      occupation = Math.round((real / stat) * 100)
    }

    const { data: sat } = await supabase
      .from('satisfaction_reponses')
      .select('score_cours, score_encadrement, score_infra, score_vie_etudiante')
    if (sat && sat.length > 0) {
      const moy = sat.reduce((s, r) => s + (r.score_cours + r.score_encadrement + r.score_infra + r.score_vie_etudiante) / 4, 0)
      satisfaction = (moy / sat.length).toFixed(1)

      // Graphique RadarChart satisfaction
      new Chart(canvasSatisfaction, {
        type: 'radar',
        data: {
          labels: ['Cours', 'Encadrement', 'Infrastructures', 'Vie étudiante'],
          datasets: [{
            label: 'Score moyen /5',
            data: [
              (sat.reduce((s, r) => s + r.score_cours, 0) / sat.length).toFixed(1),
              (sat.reduce((s, r) => s + r.score_encadrement, 0) / sat.length).toFixed(1),
              (sat.reduce((s, r) => s + r.score_infra, 0) / sat.length).toFixed(1),
              (sat.reduce((s, r) => s + r.score_vie_etudiante, 0) / sat.length).toFixed(1)
            ],
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 2
          }]
        },
        options: {
          scales: { r: { min: 0, max: 5 } }
        }
      })
    }

    // Graphique BarChart réussite par niveau
    const { data: reussite } = await supabase
      .from('resultats_examens')
      .select('session_admission, admis')
    
    const niveaux = ['M1', 'M2', '5A']
    const { data: etudiants } = await supabase
      .from('etudiants')
      .select('id_etudiant, niveau')

    if (etudiants && reussite) {
      const tauxParNiveau = niveaux.map(n => {
        const ids = etudiants.filter(e => e.niveau === n).map(e => e.id_etudiant)
        const res = reussite.filter(r => ids.includes(r.id_etudiant))
        const admis = res.filter(r => r.admis).length
        return res.length > 0 ? Math.round((admis / res.length) * 100) : 0
      })

      new Chart(canvasReussite, {
        type: 'bar',
        data: {
          labels: niveaux,
          datasets: [{
            label: 'Taux de réussite (%)',
            data: tauxParNiveau,
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
            borderRadius: 8
          }]
        },
        options: {
          scales: { y: { min: 0, max: 100 } },
          plugins: { legend: { display: false } }
        }
      })
    }
  })
</script>

<h1 class="text-2xl font-bold mb-6">Tableau de bord — Génie Industriel ENIB</h1>

<div class="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
  <div class="bg-blue-100 p-4 rounded-xl">
    <p class="text-sm text-gray-500">Taux de réussite</p>
    <p class="text-3xl font-bold text-blue-800">{taux_reussite}%</p>
  </div>
  <div class="bg-green-100 p-4 rounded-xl">
    <p class="text-sm text-gray-500">Taux d'assiduité</p>
    <p class="text-3xl font-bold text-green-800">{taux_assiduite}%</p>
  </div>
  <div class="bg-orange-100 p-4 rounded-xl">
    <p class="text-sm text-gray-500">Occupation enseignants</p>
    <p class="text-3xl font-bold text-orange-800">{occupation}%</p>
  </div>
  <div class="bg-purple-100 p-4 rounded-xl">
    <p class="text-sm text-gray-500">Score satisfaction</p>
    <p class="text-3xl font-bold text-purple-800">{satisfaction}/5</p>
  </div>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <h2 class="font-bold mb-4 text-gray-700">Taux de réussite par promotion</h2>
    <canvas bind:this={canvasReussite}></canvas>
  </div>
  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <h2 class="font-bold mb-4 text-gray-700">Axes de satisfaction</h2>
    <canvas bind:this={canvasSatisfaction}></canvas>
  </div>
</div>