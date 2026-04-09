<script>
  import { supabase } from '$lib/supabase'
  import { onMount } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  Chart.register(...registerables)

  let taux_principale = $state(0)
  let taux_rattrapage = $state(0)
  let taux_controle = $state(0)
  let taux_assiduite = $state(0)
  let taux_couverture = $state(0)
  let taux_tp = $state(0)
  let taux_validation = $state(0)
  let taux_double_diplome = $state(0)
  let etudiants_alerte = $state(0)

  let canvasReussite
  let canvasAssiduite
  let canvasDoubleDiplome

  onMount(async () => {
    const { data: res } = await supabase
      .from('resultats_examens')
      .select('admis, session_admission, note_rattrapage')
    if (res && res.length > 0) {
      const principale = res.filter(r => r.session_admission === 'principale').length
      const rattrapage = res.filter(r => r.session_admission === 'rattrapage').length
      const passeRattrapage = res.filter(r => r.note_rattrapage !== null).length
      taux_principale = Math.round((principale / res.length) * 100)
      taux_controle = Math.round((passeRattrapage / res.length) * 100)
      taux_rattrapage = passeRattrapage > 0 ? Math.round((rattrapage / passeRattrapage) * 100) : 0
      taux_validation = Math.round(((principale + rattrapage) / res.length) * 100)

      // BarChart réussite principale vs rattrapage
      new Chart(canvasReussite, {
        type: 'bar',
        data: {
          labels: ['Session principale', 'Rattrapage'],
          datasets: [{
            label: 'Taux de réussite (%)',
            data: [taux_principale, taux_rattrapage],
            backgroundColor: ['#3b82f6', '#f59e0b'],
            borderRadius: 8
          }]
        },
        options: {
          scales: { y: { min: 0, max: 100 } },
          plugins: { legend: { display: false } }
        }
      })
    }

    const { data: abs } = await supabase
      .from('absences_etudiants')
      .select('nb_justifiees, nb_injustifiees, mois')
    if (abs && abs.length > 0) {
      const total = abs.reduce((s, a) => s + a.nb_justifiees + a.nb_injustifiees, 0)
      const injust = abs.reduce((s, a) => s + a.nb_injustifiees, 0)
      taux_assiduite = Math.round(100 - (injust / total) * 100)

      // LineChart assiduité par mois
      const mois = [...new Set(abs.map(a => a.mois))].sort()
      const tauxParMois = mois.map(m => {
        const absM = abs.filter(a => a.mois === m)
        const tot = absM.reduce((s, a) => s + a.nb_justifiees + a.nb_injustifiees, 0)
        const inj = absM.reduce((s, a) => s + a.nb_injustifiees, 0)
        return tot > 0 ? Math.round(100 - (inj / tot) * 100) : 100
      })

      new Chart(canvasAssiduite, {
        type: 'line',
        data: {
          labels: mois,
          datasets: [{
            label: "Taux d'assiduité (%)",
            data: tauxParMois,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          scales: { y: { min: 0, max: 100 } }
        }
      })
    }

    const { data: cov } = await supabase
      .from('couverture_cours')
      .select('seances_planifiees, seances_realisees')
    if (cov && cov.length > 0) {
      const planif = cov.reduce((s, c) => s + c.seances_planifiees, 0)
      const real = cov.reduce((s, c) => s + c.seances_realisees, 0)
      taux_couverture = Math.round((real / planif) * 100)
    }

    const { data: tp } = await supabase
      .from('travaux_pratiques')
      .select('statut')
    if (tp && tp.length > 0) {
      const dispo = tp.filter(t => t.statut === 'disponible').length
      taux_tp = Math.round((dispo / tp.length) * 100)
    }

    const { data: etu } = await supabase
      .from('etudiants')
      .select('niveau, double_diplome')
    if (etu) {
      const m2 = etu.filter(e => e.niveau === 'M2')
      const dd = m2.filter(e => e.double_diplome)
      taux_double_diplome = m2.length > 0 ? Math.round((dd.length / m2.length) * 100) : 0

      // PieChart double diplôme
      new Chart(canvasDoubleDiplome, {
        type: 'doughnut',
        data: {
          labels: ['Double diplôme', 'Normal'],
          datasets: [{
            data: [dd.length, m2.length - dd.length],
            backgroundColor: ['#3b82f6', '#e5e7eb']
          }]
        },
        options: {
          plugins: { legend: { position: 'bottom' } }
        }
      })
    }

    const { data: alerte } = await supabase
      .from('absences_etudiants')
      .select('id_etudiant, nb_injustifiees')
    if (alerte) {
      etudiants_alerte = alerte.filter(a => a.nb_injustifiees > 3).length
    }
  })

  function couleur(valeur, seuil_rouge, seuil_orange) {
    if (valeur < seuil_rouge) return 'text-red-600'
    if (valeur < seuil_orange) return 'text-orange-500'
    return 'text-green-600'
  }
</script>

<h1 class="text-2xl font-bold mb-6">Module Enseignement — 11 KPIs</h1>

<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Taux réussite session principale</p>
    <p class="text-3xl font-bold {couleur(taux_principale, 60, 75)}">{taux_principale}%</p>
    <p class="text-xs text-gray-400">Seuil : 60% minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Taux réussite rattrapage</p>
    <p class="text-3xl font-bold {couleur(taux_rattrapage, 40, 60)}">{taux_rattrapage}%</p>
    <p class="text-xs text-gray-400">Seuil : 40% minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Taux de contrôle (rattrapage)</p>
    <p class="text-3xl font-bold {couleur(100 - taux_controle, 70, 80)}">{taux_controle}%</p>
    <p class="text-xs text-gray-400">Seuil alerte : &gt; 30%</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Taux d'assiduité</p>
    <p class="text-3xl font-bold {couleur(taux_assiduite, 70, 85)}">{taux_assiduite}%</p>
    <p class="text-xs text-gray-400">Seuil : 70% minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Couverture des cours</p>
    <p class="text-3xl font-bold {couleur(taux_couverture, 80, 90)}">{taux_couverture}%</p>
    <p class="text-xs text-gray-400">Seuil : 80% minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">TP disponibles</p>
    <p class="text-3xl font-bold {couleur(taux_tp, 80, 90)}">{taux_tp}%</p>
    <p class="text-xs text-gray-400">Seuil : 80% minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Taux de validation</p>
    <p class="text-3xl font-bold {couleur(taux_validation, 70, 85)}">{taux_validation}%</p>
    <p class="text-xs text-gray-400">Seuil : 70% minimum</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Double diplôme 4A (M2)</p>
    <p class="text-3xl font-bold text-blue-600">{taux_double_diplome}%</p>
    <p class="text-xs text-gray-400">% étudiants M2</p>
  </div>

  <div class="bg-white border rounded-xl p-4 shadow-sm">
    <p class="text-sm text-gray-500">Étudiants en alerte</p>
    <p class="text-3xl font-bold {etudiants_alerte > 0 ? 'text-red-600' : 'text-green-600'}">{etudiants_alerte}</p>
    <p class="text-xs text-gray-400">Absences injustifiées &gt; 3</p>
  </div>

</div>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div class="bg-white border rounded-xl p-4 shadow-sm md:col-span-1">
    <h2 class="font-bold mb-4 text-gray-700">Réussite : Principale vs Rattrapage</h2>
    <canvas bind:this={canvasReussite}></canvas>
  </div>
  <div class="bg-white border rounded-xl p-4 shadow-sm md:col-span-1">
    <h2 class="font-bold mb-4 text-gray-700">Assiduité mensuelle</h2>
    <canvas bind:this={canvasAssiduite}></canvas>
  </div>
  <div class="bg-white border rounded-xl p-4 shadow-sm md:col-span-1">
    <h2 class="font-bold mb-4 text-gray-700">Double diplôme M2</h2>
    <canvas bind:this={canvasDoubleDiplome}></canvas>
  </div>
</div>