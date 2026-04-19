<script>
  import { supabase } from '$lib/supabase'
  import { onMount } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  Chart.register(...registerables)

  let conventions_actives = $state(0)
  let nb_visites = $state(0)
  let nb_etudiants_visites = $state(0)
  let nb_seminaires = $state(0)
  let score_seminaires = $state(0)
  let nb_unites_actives = $state(0)
  let nb_participants_unites = $state(0)

  let canvasVisites
  let canvasUnites

  onMount(async () => {
    // Conventions actives
    const { data: part } = await supabase
      .from('partenariats')
      .select('convention_active, type')
    if (part) {
      conventions_actives = part.filter(p => p.convention_active).length
    }

    // Visites entreprises
    const { data: visites } = await supabase
      .from('visites_entreprises')
      .select('nb_etudiants, nb_encadrants, niveau_participants')
    if (visites && visites.length > 0) {
      nb_visites = visites.length
      nb_etudiants_visites = visites.reduce((s, v) => s + v.nb_etudiants, 0)

      // BarChart visites par niveau
      const niveaux = ['M1', 'M2', '5A']
      const visitesParNiveau = niveaux.map(n =>
        visites.filter(v => v.niveau_participants === n)
               .reduce((s, v) => s + v.nb_etudiants, 0)
      )

      new Chart(canvasVisites, {
        type: 'bar',
        data: {
          labels: niveaux,
          datasets: [{
            label: 'Étudiants participants',
            data: visitesParNiveau,
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
            borderRadius: 8
          }]
        },
        options: {
          plugins: { legend: { display: false } }
        }
      })
    }

    // Séminaires
    const { data: sem } = await supabase
      .from('seminaires_industriels')
      .select('evaluation_moyenne, nb_participants')
    if (sem && sem.length > 0) {
      nb_seminaires = sem.length
      const moy = sem.reduce((s, r) => s + r.evaluation_moyenne, 0)
      score_seminaires = (moy / sem.length).toFixed(1)
    }

    // Unités d'expertise
    const { data: unites } = await supabase
      .from('unites_expertise')
      .select('actif, nb_participants_cumul, intitule')
    if (unites) {
      nb_unites_actives = unites.filter(u => u.actif).length
      nb_participants_unites = unites.reduce((s, u) => s + u.nb_participants_cumul, 0)

      // BarChart participants par unité
      new Chart(canvasUnites, {
        type: 'bar',
        data: {
          labels: unites.map(u => u.intitule.substring(0, 20) + '...'),
          datasets: [{
            label: 'Participants cumulés',
            data: unites.map(u => u.nb_participants_cumul),
            backgroundColor: '#8b5cf6',
            borderRadius: 8
          }]
        },
        options: {
          plugins: { legend: { display: false } }
        }
      })
    }
  })
</script>

<h1 class="text-2xl font-bold mb-6">Module Rayonnement — 7 KPIs</h1>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Conventions actives</p>
    <p class="text-3xl font-bold text-blue-600">{conventions_actives}</p>
    <p class="text-xs text-gray-400">Partenariats en cours</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Visites entreprises / an</p>
    <p class="text-3xl font-bold text-green-600">{nb_visites}</p>
    <p class="text-xs text-gray-400">Visites industrielles</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Étudiants participants</p>
    <p class="text-3xl font-bold text-orange-600">{nb_etudiants_visites}</p>
    <p class="text-xs text-gray-400">Aux visites entreprises</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Séminaires industriels</p>
    <p class="text-3xl font-bold text-purple-600">{nb_seminaires}</p>
    <p class="text-xs text-gray-400">Par année universitaire</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Score évaluation séminaires</p>
    <p class="text-3xl font-bold {score_seminaires < 3 ? 'text-red-600' : 'text-green-600'}">{score_seminaires}/5</p>
    <p class="text-xs text-gray-400">Seuil : 3/5 minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Unités d'expertise actives</p>
    <p class="text-3xl font-bold text-blue-600">{nb_unites_actives}</p>
    <p class="text-xs text-gray-400">Unités en activité</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Participants unités cumulés</p>
    <p class="text-3xl font-bold text-green-600">{nb_participants_unites}</p>
    <p class="text-xs text-gray-400">Total participants</p>
  </div>

</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <h2 class="font-bold mb-4 text-gray-700">Étudiants participants aux visites par niveau</h2>
    <canvas bind:this={canvasVisites}></canvas>
  </div>
  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <h2 class="font-bold mb-4 text-gray-700">Participants cumulés par unité d'expertise</h2>
    <canvas bind:this={canvasUnites}></canvas>
  </div>
</div>