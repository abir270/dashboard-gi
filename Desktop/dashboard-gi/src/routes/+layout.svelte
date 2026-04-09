<script>
 import './layout.css'
  let { children } = $props();
</script>

<nav class="bg-blue-900 text-white p-4 flex gap-6">
  <a href="/" class="font-bold text-lg">Dashboard GI</a>
  <a href="/enseignement" class="hover:underline">Enseignement</a>
  <a href="/rh" class="hover:underline">RH</a>
  <a href="/encadrement" class="hover:underline">Encadrement</a>
  <a href="/satisfaction" class="hover:underline">Satisfaction</a>
</nav>

<main class="p-6">
  {@render children()}
</main>