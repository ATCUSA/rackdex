<script lang="ts">
	import Footer from '#lib/components/Footer.svelte';
	import Header from '#lib/components/Header.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { REPO_URL } from '#lib/github';

	const link = 'text-sky-600 hover:underline dark:text-sky-400';
</script>

<Seo
	title="About RackDex — importing NetBox device types, FAQ and credits"
	description="How RackDex works, how to import device, module and rack types into NetBox from YAML, answers to common import errors, and credit to the NetBox Device Type Library contributors."
	path="/about"
/>

<div class="flex min-h-dvh flex-col">
	<Header showSearch={false} />
	<main class="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 text-sm leading-relaxed">
		<h1 class="text-2xl font-semibold">About</h1>

		<section class="space-y-2">
			<h2 class="text-lg font-semibold">Credit where it's due</h2>
			<p>
				This site is a search interface only. Every definition it shows is the work of the maintainers and
				<a class={link} href={`${REPO_URL}/graphs/contributors`} target="_blank" rel="noopener">contributors</a> of the
				<a class={link} href={REPO_URL} target="_blank" rel="noopener">netbox-community/devicetype-library</a>, released under
				<a class={link} href={`${REPO_URL}/blob/master/LICENSE.txt`} target="_blank" rel="noopener">CC0-1.0</a>. If a type is missing or
				wrong, please <a class={link} href={`${REPO_URL}/blob/master/CONTRIBUTING.md`} target="_blank" rel="noopener">contribute upstream</a>.
			</p>
			<p>This project is unofficial and not affiliated with NetBox Labs.</p>
		</section>

		<section class="space-y-2">
			<h2 class="text-lg font-semibold">Importing into NetBox</h2>
			<ol class="list-decimal space-y-1 pl-5">
				<li>Make sure the manufacturer exists (Devices → Manufacturers). The name must match the YAML's <code>manufacturer</code> exactly — use the manufacturer helper to copy it or its CSV.</li>
				<li>Copy or download the YAML for a type, or add several to your selection and export them combined.</li>
				<li>In NetBox go to Devices → Device Types → Import (or Devices → Module Types → Import; rack types live under Racks → Rack Types → Import), paste the YAML or upload the file, and submit.</li>
			</ol>
		</section>

		<section class="space-y-2">
			<h2 class="text-lg font-semibold">How the data stays fresh</h2>
			<p>
				The search index is built from the library when this site is deployed. Each visit also asks GitHub (one API call, cached
				for 15 minutes) what changed on <code>master</code> since then and applies those changes in your browser. YAML and images are
				always fetched straight from GitHub. If GitHub rate-limits the check, the site keeps working with the deployed data.
			</p>
			<p>Categories (switch, PDU, patch panel, …) are inferred from each type's components — the library doesn't define them.</p>
		</section>

		<section class="space-y-3">
			<h2 class="text-lg font-semibold">FAQ</h2>
			<div>
				<h3 class="font-semibold">NetBox says the manufacturer doesn't exist</h3>
				<p>
					NetBox matches a device type's <code>manufacturer</code> by its exact name, and the manufacturer must already exist.
					Create it first under Devices → Manufacturers, using the name from the manufacturer helper.
					<code>Hewlett Packard Enterprise</code> and <code>HPE</code> are different manufacturers to NetBox.
				</p>
			</div>
			<div>
				<h3 class="font-semibold">Can I import many device types at once?</h3>
				<p>
					Yes. Add types to your selection, then use Copy combined or Download combined. You get one YAML file with every type
					separated by <code>---</code>, which NetBox's import page accepts in one go. The selection also gives you a
					manufacturer CSV for Devices → Manufacturers → Import.
				</p>
			</div>
			<div>
				<h3 class="font-semibold">What does the PoE filter mean?</h3>
				<p>
					Devices that supply PoE (PSE), such as PoE switches and injectors. Devices that only draw PoE, like access points and
					phones, don't count.
				</p>
			</div>
			<div>
				<h3 class="font-semibold">A device is missing or has wrong data</h3>
				<p>
					RackDex only displays the library. Please fix it upstream with a pull request to the
					<a class={link} href={`${REPO_URL}/blob/master/CONTRIBUTING.md`} target="_blank" rel="noopener">devicetype-library</a>;
					it shows up here automatically once merged.
				</p>
			</div>
		</section>

		<Footer />
	</main>
</div>
