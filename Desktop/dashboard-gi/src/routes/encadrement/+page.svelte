<script>
  import { supabase } from '$lib/supabase'
  import { onMount } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  Chart.register(...registerables)

  let projets_par_encadrant = $state(0)
  let note_moyenne_pfe = $state(0)
  let note_moyenne_pjm = $state(0)
  let note_moyenne_amp = $state(0)
  let taux_emploi_pfe = $state(0)
  let entreprises_actives = $state(0)
  let nb_pfe = $state(0)
  let nb_pjm = $state(0)
  let nb_amp = $state(0)

  let canvasNotes
  let canvasEmploi
  let canvasRepartition

  onMount(async () => {
    const { data: pfe } = await supabase
      .from('pfe_evaluation')
      .select('note_rapport, note_soutenance')
    if (pfe && pfe.length > 0) {
      const moy = pfe.reduce((s, p) => s + (p.note_rapport + p.note_soutenance) / 2, 0)
      note_moyenne_pfe = (moy / pfe.length).toFixed(1)
      nb_pfe = pfe.length
    }

    const { data: pjm } = await supabase
      .from('pjm_evaluation')
      .select('note_rapport, note_presentation')
    if (pjm && pjm.length > 0) {
      const moy = pjm.reduce((s, p) => s + (p.note_rapport + p.note_presentation) / 2, 0)
      note_moyenne_pjm = (moy / pjm.length).toFixed(1)
      nb_pjm = pjm.length
    }

    const { data: amp } = await supabase
      .from('amp_evaluation')
      .select('note_memoire')
    if (amp && amp.length > 0) {
      const moy = amp.reduce((s, a) => s + a.note_memoire, 0)
      note_moyenne_amp = (moy / amp.length).toFixed(1)
      nb_amp = amp.length
    }

    // BarChart notes moyennes PFE / PJM / AMP
    new Chart(canvasNotes, {
      type: 'bar',
      data: {
        labels: ['PFE', 'PJM', 'AMP'],
        datasets: [{
          label: 'Note moyenne /20',
          data: [note_moyenne_pfe, note_moyenne_pjm, note_moyenne_amp],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
          borderRadius: 8
        }]
      },
      options: {
        scales: { y: { min: 0, max: 20 } },
        plugins: { legend: { display: false } }
      }
    })

    // PieChart répartition projets
    new Chart(canvasRepartition, {
      type: 'doughnut',
      data: {
        labels: ['PFE', 'PJM', 'AMP'],
        datasets: [{
          data: [nb_pfe, nb_pjm, nb_amp],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
        }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } }
      }
    })

    const { data: debouche } = await supabase
      .from('pfe_debouche')
      .select('embauche')
    if (debouche && debouche.length > 0) {
      const embauches = debouche.filter(d => d.embauche).length
      taux_emploi_pfe = Math.round((embauches / debouche.length) * 100)

      // Donut emploi post-PFE
      new Chart(canvasEmploi, {
        type: 'doughnut',
        data: {
          labels: ['Embauchés', 'Non embauchés'],
          datasets: [{
            data: [embauches, debouche.length - embauches],
            backgroundColor: ['#10b981', '#e5e7eb']
          }]
        },
        options: {
          plugins: { legend: { position: 'bottom' } }
        }
      })
    }

    const { data: entreprises } = await supabase
      .from('entreprises')
      .select('convention_active')
    if (entreprises) {
      entreprises_actives = entreprises.filter(e => e.convention_active).length
    }

    const { data: pfeEnc } = await supabase
      .from('pfe_encadrement')
      .select('id_enseignant')
    const { data: pjmEnc } = await supabase
      .from('pjm_evaluation')
      .select('id_enseignant')
    const { data: ampEnc } = await supabase
      .from('amp_evaluation')
      .select('id_enseignant')
    if (pfeEnc && pjmEnc && ampEnc) {
      const total = pfeEnc.length + pjmEnc.length + ampEnc.length
      const encadrants = new Set([
        ...pfeEnc.map(p => p.id_enseignant),
        ...pjmEnc.map(p => p.id_enseignant),
        ...ampEnc.map(p => p.id_enseignant)
      ])
      projets_par_encadrant = encadrants.size > 0 ? (total / encadrants.size).toFixed(1) : 0
    }
  })
</script>

<h1 class="text-2xl font-bold mb-6">Module Encadrement — 7 KPIs</h1>

<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Projets par encadrant</p>
    <p class="text-3xl font-bold {projets_par_encadrant > 10 ? 'text-red-600' : 'text-green-600'}">{projets_par_encadrant}</p>
    <p class="text-xs text-gray-400">Seuil alerte : &gt; 10 projets</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Note moyenne PFE</p>
    <p class="text-3xl font-bold {note_moyenne_pfe < 12 ? 'text-orange-500' : 'text-green-600'}">{note_moyenne_pfe}/20</p>
    <p class="text-xs text-gray-400">Seuil : 12/20 minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Note moyenne PJM</p>
    <p class="text-3xl font-bold {note_moyenne_pjm < 12 ? 'text-orange-500' : 'text-green-600'}">{note_moyenne_pjm}/20</p>
    <p class="text-xs text-gray-400">Seuil : 12/20 minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Note moyenne AMP</p>
    <p class="text-3xl font-bold {note_moyenne_amp < 12 ? 'text-orange-500' : 'text-green-600'}">{note_moyenne_amp}/20</p>
    <p class="text-xs text-gray-400">Seuil : 12/20 minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Taux emploi post-PFE</p>
    <p class="text-3xl font-bold {taux_emploi_pfe < 50 ? 'text-orange-500' : 'text-green-600'}">{taux_emploi_pfe}%</p>
    <p class="text-xs text-gray-400">Seuil : 50% minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Entreprises partenaires</p>
    <p class="text-3xl font-bold text-blue-600">{entreprises_actives}</p>
    <p class="text-xs text-gray-400">Conventions actives</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Répartition projets</p>
    <p class="text-sm font-bold text-blue-600">PFE : {nb_pfe} | PJM : {nb_pjm} | AMP : {nb_amp}</p>
    <p class="text-xs text-gray-400">Total : {nb_pfe + nb_pjm + nb_amp} projets</p>
  </div>

</div>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <h2 class="font-bold mb-4 text-gray-700">Notes moyennes PFE / PJM / AMP</h2>
    <canvas bind:this={canvasNotes}></canvas>
  </div>
  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <h2 class="font-bold mb-4 text-gray-700">Taux emploi post-PFE</h2>
    <canvas bind:this={canvasEmploi}></canvas>
  </div>
  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <h2 class="font-bold mb-4 text-gray-700">Répartition par type de projet</h2>
    <canvas bind:this={canvasRepartition}></canvas>
  </div>
</div>