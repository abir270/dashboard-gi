<script>
  import './layout.css'
  import { supabase } from '$lib/supabase'
  import { goto } from '$app/navigation'
  let { children } = $props()

  async function logout() {
    await supabase.auth.signOut()
    goto('/login')
  }
</script>

<nav class="bg-blue-900 text-white p-4 flex gap-6 items-center">
  <a href="/" class="font-bold text-lg">Dashboard GI</a>
  <a href="/enseignement" class="hover:underline">Enseignement</a>
  <a href="/rh" class="hover:underline">RH</a>
  <a href="/encadrement" class="hover:underline">Encadrement</a>
  <a href="/satisfaction" class="hover:underline">Satisfaction</a>
  <a href="/rayonnement" class="hover:underline">Rayonnement</a>
  
  <button
    on:click={logout}
    class="ml-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
  >
    Se déconnecter
  </button>
</nav>

<main class="p-6">
  {@render children()}
</main>