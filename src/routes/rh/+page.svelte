<script>
  import { supabase } from '$lib/supabase'
  import { onMount } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  Chart.register(...registerables)

  let taux_occupation = $state(0)
  let ratio_perm_vac = $state(0)
  let modules_non_couverts = $state(0)
  let contrats_renouveler = $state(0)
  let charge_moyenne = $state(0)
  let enseignants_surcharge = $state(0)
  let couverture_rh = $state(0)
  let execution_vacataires = $state(0)

  let canvasCharge
  let canvasRatio
  let canvasExecution

  onMount(async () => {
    const { data: charge } = await supabase
      .from('charge_permanents')
      .select('heures_statutaires, heures_realisees, id_enseignant')
    const { data: permanents } = await supabase
      .from('permanents')
      .select('id_enseignant, nom, prenom')

    if (charge && charge.length > 0) {
      const stat = charge.reduce((s, c) => s + c.heures_statutaires, 0)
      const real = charge.reduce((s, c) => s + c.heures_realisees, 0)
      taux_occupation = Math.round((real / stat) * 100)
      charge_moyenne = Math.round(real / charge.length)
      enseignants_surcharge = charge.filter(c => c.heures_realisees > c.heures_statutaires).length
      couverture_rh = Math.round((real / stat) * 100)

      // BarChart charge par enseignant
      if (permanents) {
        const labels = charge.map(c => {
          const p = permanents.find(p => p.id_enseignant === c.id_enseignant)
          return p ? p.nom : `#${c.id_enseignant}`
        })
        new Chart(canvasCharge, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Heures réalisées',
                data: charge.map(c => c.heures_realisees),
                backgroundColor: '#3b82f6',
                borderRadius: 6
              },
              {
                label: 'Heures statutaires',
                data: charge.map(c => c.heures_statutaires),
                backgroundColor: '#e5e7eb',
                borderRadius: 6
              }
            ]
          },
          options: {
            plugins: { legend: { position: 'bottom' } }
          }
        })
      }
    }

    const { data: contrats } = await supabase
      .from('suivi_contrats')
      .select('renouvellement, date_expiration')
    if (contrats) {
      contrats_renouveler = contrats.filter(c => c.renouvellement === true).length
    }

    const { data: perm } = await supabase
      .from('charge_permanents')
      .select('heures_realisees')
    const { data: vac } = await supabase
      .from('charge_vacataires')
      .select('heures_realisees, heures_contractuelles')

    if (perm && vac) {
      const hPerm = perm.reduce((s, p) => s + p.heures_realisees, 0)
      const hVac = vac.reduce((s, v) => s + v.heures_realisees, 0)
      ratio_perm_vac = Math.round((hPerm / (hPerm + hVac)) * 100)
      const hContrat = vac.reduce((s, v) => s + v.heures_contractuelles, 0)
      execution_vacataires = hContrat > 0 ? Math.round((hVac / hContrat) * 100) : 0

      // PieChart ratio permanents / vacataires
      new Chart(canvasRatio, {
        type: 'doughnut',
        data: {
          labels: ['Permanents', 'Vacataires'],
          datasets: [{
            data: [hPerm, hVac],
            backgroundColor: ['#3b82f6', '#f59e0b']
          }]
        },
        options: {
          plugins: { legend: { position: 'bottom' } }
        }
      })

      // BarChart exécution vacataires
      new Chart(canvasExecution, {
        type: 'bar',
        data: {
          labels: ['Heures contractuelles', 'Heures réalisées'],
          datasets: [{
            data: [hContrat, hVac],
            backgroundColor: ['#e5e7eb', '#10b981'],
            borderRadius: 8
          }]
        },
        options: {
          plugins: { legend: { display: false } }
        }
      })
    }

    const { data: modules } = await supabase
      .from('modules_heures')
      .select('id_module')
    const { data: matieresPerm } = await supabase
      .from('matieres_permanents')
      .select('id_module')
    if (modules && matieresPerm) {
      const couverts = new Set(matieresPerm.map(m => m.id_module))
      modules_non_couverts = modules.filter(m => !couverts.has(m.id_module)).length
    }
  })

  function couleur(valeur, seuil_rouge, seuil_orange) {
    if (valeur < seuil_rouge) return 'text-red-600'
    if (valeur < seuil_orange) return 'text-orange-500'
    return 'text-green-600'
  }
</script>

<h1 class="text-2xl font-bold mb-6">Module RH — 8 KPIs</h1>

<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Taux d'occupation</p>
    <p class="text-3xl font-bold {taux_occupation > 100 ? 'text-red-600' : 'text-green-600'}">{taux_occupation}%</p>
    <p class="text-xs text-gray-400">Seuil : &gt; 100% alerte</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Ratio perm / vac</p>
    <p class="text-3xl font-bold {couleur(ratio_perm_vac, 60, 75)}">{ratio_perm_vac}%</p>
    <p class="text-xs text-gray-400">Seuil : 60% minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Couverture RH</p>
    <p class="text-3xl font-bold {couleur(couverture_rh, 90, 95)}">{couverture_rh}%</p>
    <p class="text-xs text-gray-400">Seuil : 90% minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Modules non couverts</p>
    <p class="text-3xl font-bold {modules_non_couverts > 0 ? 'text-red-600' : 'text-green-600'}">{modules_non_couverts}</p>
    <p class="text-xs text-gray-400">Seuil : 0 idéal</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Exécution vacataires</p>
    <p class="text-3xl font-bold {couleur(execution_vacataires, 80, 90)}">{execution_vacataires}%</p>
    <p class="text-xs text-gray-400">Seuil : 80% minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Contrats à renouveler</p>
    <p class="text-3xl font-bold {contrats_renouveler > 0 ? 'text-orange-500' : 'text-green-600'}">{contrats_renouveler}</p>
    <p class="text-xs text-gray-400">Renouvellement en attente</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Charge moyenne</p>
    <p class="text-3xl font-bold text-blue-600">{charge_moyenne}h</p>
    <p class="text-xs text-gray-400">Heures réalisées moyennes</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Enseignants en surcharge</p>
    <p class="text-3xl font-bold {enseignants_surcharge > 0 ? 'text-red-600' : 'text-green-600'}">{enseignants_surcharge}</p>
    <p class="text-xs text-gray-400">Heures &gt; statutaires</p>
  </div>

</div>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div class="bg-white border rounded-xl p-4 shadow-sm md:col-span-1">
    <h2 class="font-bold mb-4 text-gray-700">Ratio Permanents / Vacataires</h2>
    <canvas bind:this={canvasRatio}></canvas>
  </div>
  <div class="bg-white border rounded-xl p-4 shadow-sm md:col-span-1">
    <h2 class="font-bold mb-4 text-gray-700">Charge réalisée vs statutaire</h2>
    <canvas bind:this={canvasCharge}></canvas>
  </div>
  <div class="bg-white border rounded-xl p-4 shadow-sm md:col-span-1">
    <h2 class="font-bold mb-4 text-gray-700">Exécution contrats vacataires</h2>
    <canvas bind:this={canvasExecution}></canvas>
  </div>
</div>