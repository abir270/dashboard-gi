<script>
  import { supabase } from '$lib/supabase'
  import { onMount } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  Chart.register(...registerables)

  let enseignant = $state(null)
  let charge = $state(null)
  let matieres = $state([])
  let projets_pfe = $state([])
  let projets_pjm = $state([])
  let projets_amp = $state([])
  let chargement = $state(true)
  let canvasCharge

  onMount(async () => {
    const { data: perm } = await supabase
      .from('permanents')
      .select('*')
      .limit(1)
      .single()

    if (perm) {
      enseignant = perm

      const { data: ch } = await supabase
        .from('charge_permanents')
        .select('*')
        .eq('id_enseignant', perm.id_enseignant)

      if (ch && ch.length > 0) {
        charge = ch[0]

        new Chart(canvasCharge, {
          type: 'bar',
          data: {
            labels: ['Statutaires', 'Réalisées', 'CM', 'TD', 'TP'],
            datasets: [{
              label: 'Heures',
              data: [
                charge.heures_statutaires,
                charge.heures_realisees,
                charge.heures_cm,
                charge.heures_td,
                charge.heures_tp
              ],
              backgroundColor: ['#e5e7eb', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
              borderRadius: 8
            }]
          },
          options: {
            plugins: { legend: { display: false } }
          }
        })
      }

      const { data: mat } = await supabase
        .from('matieres_permanents')
        .select('id_matiere, role')
        .eq('id_enseignant', perm.id_enseignant)
      if (mat) matieres = mat

      const { data: pfe } = await supabase
        .from('pfe_encadrement')
        .select('id_pfe, tuteur_entreprise')
        .eq('id_enseignant', perm.id_enseignant)
      if (pfe) projets_pfe = pfe

      const { data: pjm } = await supabase
        .from('pjm_evaluation')
        .select('id_pjm, note_rapport, note_presentation')
        .eq('id_enseignant', perm.id_enseignant)
      if (pjm) projets_pjm = pjm

      const { data: amp } = await supabase
        .from('amp_evaluation')
        .select('id_amp, note_memoire')
        .eq('id_enseignant', perm.id_enseignant)
      if (amp) projets_amp = amp
    }

    chargement = false
  })

  function taux_occupation() {
    if (!charge) return 0
    return Math.round((charge.heures_realisees / charge.heures_statutaires) * 100)
  }
</script>

{#if chargement}
  <div class="flex items-center justify-center h-64">
    <p class="text-gray-500 text-xl">Chargement...</p>
  </div>
{:else if enseignant}

  <div class="mb-6">
    <h1 class="text-2xl font-bold text-blue-900">
      Bienvenue, {enseignant.prenom} {enseignant.nom}
    </h1>
    <p class="text-gray-500">{enseignant.grade} — Département Génie Industriel</p>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

    <div class="bg-blue-100 p-4 rounded-xl">
      <p class="text-sm text-gray-500">Taux d'occupation</p>
      <p class="text-3xl font-bold {taux_occupation() > 100 ? 'text-red-600' : 'text-blue-800'}">{taux_occupation()}%</p>
    </div>

    <div class="bg-green-100 p-4 rounded-xl">
      <p class="text-sm text-gray-500">Heures réalisées</p>
      <p class="text-3xl font-bold text-green-800">{charge?.heures_realisees || 0}h</p>
    </div>

    <div class="bg-orange-100 p-4 rounded-xl">
      <p class="text-sm text-gray-500">Matières enseignées</p>
      <p class="text-3xl font-bold text-orange-800">{matieres.length}</p>
    </div>

    <div class="bg-purple-100 p-4 rounded-xl">
      <p class="text-sm text-gray-500">Projets encadrés</p>
      <p class="text-3xl font-bold text-purple-800">{projets_pfe.length + projets_pjm.length + projets_amp.length}</p>
    </div>

  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white border rounded-xl p-4 shadow-sm">
      <h2 class="font-bold mb-4 text-gray-700">Ma charge horaire</h2>
      <canvas bind:this={canvasCharge}></canvas>
    </div>

    <div class="bg-white border rounded-xl p-4 shadow-sm">
      <h2 class="font-bold mb-4 text-gray-700">Mes projets encadrés</h2>
      <div class="space-y-3">
        <div class="flex justify-between p-3 bg-blue-50 rounded-lg">
          <span class="text-sm font-medium">PFE</span>
          <span class="font-bold text-blue-600">{projets_pfe.length}</span>
        </div>
        <div class="flex justify-between p-3 bg-green-50 rounded-lg">
          <span class="text-sm font-medium">PJM</span>
          <span class="font-bold text-green-600">{projets_pjm.length}</span>
        </div>
        <div class="flex justify-between p-3 bg-orange-50 rounded-lg">
          <span class="text-sm font-medium">AMP</span>
          <span class="font-bold text-orange-600">{projets_amp.length}</span>
        </div>
      </div>
    </div>
  </div>

{:else}
  <p class="text-red-500">Enseignant non trouvé.</p>
{/if}