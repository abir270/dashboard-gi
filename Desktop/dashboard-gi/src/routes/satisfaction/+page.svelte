<script>
  import { supabase } from '$lib/supabase'
  import { onMount } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  Chart.register(...registerables)

  let score_global = $state(0)
  let score_cours = $state(0)
  let score_encadrement = $state(0)
  let score_infra = $state(0)
  let score_vie = $state(0)
  let taux_participation = $state(0)
  let meilleure_matiere = $state('-')
  let pire_matiere = $state('-')

  let canvasRadar
  let canvasEvolution
  let canvasMatieres

  onMount(async () => {
    const { data: sat } = await supabase
      .from('satisfaction_reponses')
      .select('score_cours, score_encadrement, score_infra, score_vie_etudiante, semestre')
    if (sat && sat.length > 0) {
      score_cours = (sat.reduce((s, r) => s + r.score_cours, 0) / sat.length).toFixed(1)
      score_encadrement = (sat.reduce((s, r) => s + r.score_encadrement, 0) / sat.length).toFixed(1)
      score_infra = (sat.reduce((s, r) => s + r.score_infra, 0) / sat.length).toFixed(1)
      score_vie = (sat.reduce((s, r) => s + r.score_vie_etudiante, 0) / sat.length).toFixed(1)
      score_global = ((+score_cours + +score_encadrement + +score_infra + +score_vie) / 4).toFixed(1)

      // RadarChart axes satisfaction
      new Chart(canvasRadar, {
        type: 'radar',
        data: {
          labels: ['Cours', 'Encadrement', 'Infrastructures', 'Vie étudiante'],
          datasets: [{
            label: 'Score /5',
            data: [score_cours, score_encadrement, score_infra, score_vie],
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 2
          }]
        },
        options: {
          scales: { r: { min: 0, max: 5 } }
        }
      })

      // LineChart évolution par semestre
      const semestres = [...new Set(sat.map(r => r.semestre))].sort()
      const moyParSemestre = semestres.map(s => {
        const satS = sat.filter(r => r.semestre === s)
        const moy = satS.reduce((sum, r) => sum + (r.score_cours + r.score_encadrement + r.score_infra + r.score_vie_etudiante) / 4, 0)
        return (moy / satS.length).toFixed(1)
      })

      new Chart(canvasEvolution, {
        type: 'line',
        data: {
          labels: semestres,
          datasets: [{
            label: 'Score moyen /5',
            data: moyParSemestre,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          scales: { y: { min: 0, max: 5 } }
        }
      })
    }

    // Taux participation
    const { data: etu } = await supabase
      .from('etudiants')
      .select('id_etudiant')
    if (etu && sat) {
      taux_participation = Math.round((sat.length / etu.length) * 100)
    }

    // BarChart meilleures / pires matières
    const { data: matSat } = await supabase
      .from('satisfaction_matieres')
      .select('score, id_matiere')
    if (matSat && matSat.length > 0) {
      const sorted = [...matSat].sort((a, b) => b.score - a.score)
      meilleure_matiere = `Matière #${sorted[0].id_matiere} (${sorted[0].score}/5)`
      pire_matiere = `Matière #${sorted[sorted.length-1].id_matiere} (${sorted[sorted.length-1].score}/5)`

      new Chart(canvasMatieres, {
        type: 'bar',
        data: {
          labels: matSat.map(m => `Matière #${m.id_matiere}`),
          datasets: [{
            label: 'Score /5',
            data: matSat.map(m => m.score),
            backgroundColor: matSat.map(m =>
              m.score >= 4 ? '#10b981' :
              m.score >= 3 ? '#f59e0b' : '#ef4444'
            ),
            borderRadius: 8
          }]
        },
        options: {
          scales: { y: { min: 0, max: 5 } },
          plugins: { legend: { display: false } }
        }
      })
    }
  })

  function couleur(valeur) {
    if (valeur < 3) return 'text-red-600'
    if (valeur < 3.5) return 'text-orange-500'
    return 'text-green-600'
  }
</script>

<h1 class="text-2xl font-bold mb-6">Module Satisfaction — 8 KPIs</h1>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Score global</p>
    <p class="text-3xl font-bold {couleur(score_global)}">{score_global}/5</p>
    <p class="text-xs text-gray-400">Seuil : 3/5 minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Score Enseignement</p>
    <p class="text-3xl font-bold {couleur(score_cours)}">{score_cours}/5</p>
    <p class="text-xs text-gray-400">Qualité des cours</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Score Encadrement</p>
    <p class="text-3xl font-bold {couleur(score_encadrement)}">{score_encadrement}/5</p>
    <p class="text-xs text-gray-400">Encadrement projets</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Score Infrastructures</p>
    <p class="text-3xl font-bold {couleur(score_infra)}">{score_infra}/5</p>
    <p class="text-xs text-gray-400">TP et équipements</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Score Vie étudiante</p>
    <p class="text-3xl font-bold {couleur(score_vie)}">{score_vie}/5</p>
    <p class="text-xs text-gray-400">Activités campus</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Taux de participation</p>
    <p class="text-3xl font-bold {taux_participation < 50 ? 'text-orange-500' : 'text-green-600'}">{taux_participation}%</p>
    <p class="text-xs text-gray-400">Seuil : 50% minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Meilleure matière</p>
    <p class="text-lg font-bold text-green-600">{meilleure_matiere}</p>
    <p class="text-xs text-gray-400">Score le plus élevé</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Matière à améliorer</p>
    <p class="text-lg font-bold text-red-600">{pire_matiere}</p>
    <p class="text-xs text-gray-400">Score le plus bas</p>
  </div>

</div>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <h2 class="font-bold mb-4 text-gray-700">Axes de satisfaction</h2>
    <canvas bind:this={canvasRadar}></canvas>
  </div>
  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <h2 class="font-bold mb-4 text-gray-700">Évolution par semestre</h2>
    <canvas bind:this={canvasEvolution}></canvas>
  </div>
  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <h2 class="font-bold mb-4 text-gray-700">Score par matière</h2>
    <canvas bind:this={canvasMatieres}></canvas>
  </div>
</div>