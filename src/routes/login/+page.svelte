<script>
  import { supabase } from '$lib/supabase'
  import { goto } from '$app/navigation'

  let email = $state('')
  let password = $state('')
  let erreur = $state('')
  let chargement = $state(false)

  async function login() {
    chargement = true
    erreur = ''

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      erreur = 'Email ou mot de passe incorrect'
      chargement = false
    } else {
      goto('/')
    }
  }
</script>

<div class="min-h-screen bg-blue-900 flex items-center justify-center">
  <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-blue-900">Dashboard GI</h1>
      <p class="text-gray-500 mt-1">École Nationale d'Ingénieurs de Bizerte</p>
    </div>

    {#if erreur}
      <div class="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
        {erreur}
      </div>
    {/if}

    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
      <input
        type="email"
        bind:value={email}
        placeholder="votre@email.com"
        class="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
      <input
        type="password"
        bind:value={password}
        placeholder="••••••••"
        class="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <button
      on:click={login}
      disabled={chargement}
      class="w-full bg-blue-900 text-white py-3 rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50"
    >
      {chargement ? 'Connexion...' : 'Se connecter'}
    </button>

  </div>
</div>