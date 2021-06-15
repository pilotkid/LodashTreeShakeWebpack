<template>
	<div>
		<v-card
			:max-width="$vuetify.breakpoint.mobile ? '100%' : '95%'"
			:elevation="$vuetify.breakpoint.mobile ? 0 : 1"
			min-height="95%"
			class="mx-auto mt-4"
			v-show="!loading"
		>
			<v-card-title>Carry Over Report</v-card-title>
			<v-card-text>
				<v-row class="mx-5">
					<v-switch v-model="OnlyEligible" label="Only Eligible" />
				</v-row>
				<div class="d-md-flex flex-sm-row flex-wrap">
					<v-col align="center" v-show="OnlyEligible">
						<h3>Carry Scores From</h3>
						<EventSelector v-model="Ev1" />
					</v-col>
					<v-col align="center">
						<h3>Carry Scores To</h3>
						<EventSelector v-model="Ev2" />
					</v-col>
				</div>
				<v-row>
					<v-col align="end">
						<v-btn color="primary" @click="run">Continue</v-btn>
					</v-col>
				</v-row>
			</v-card-text>
		</v-card>

		<!-- LOADING SCREEN -->
		<v-card
			:max-width="$vuetify.breakpoint.mobile ? '100%' : '95%'"
			:elevation="$vuetify.breakpoint.mobile ? 0 : 1"
			min-height="95%"
			class="mx-auto mt-4"
			v-show="loading"
		>
			<v-card-title>Carry Over Report</v-card-title>
			<v-card-text>
				<v-row align="center">
					<v-col>
						<v-row justify="space-around">
							<brandedloader :size="90" />
						</v-row>
						<v-row justify="space-around">
							<h3>This may take a few moments.</h3>
						</v-row>
					</v-col>
				</v-row>
			</v-card-text>
		</v-card>
	</div>
</template>

<script>
import axios from "axios";
import guideWestComposition_map from "lodash/map"
import belowStuckCool_uniq from "lodash/uniq"
import offBreakHall_filter from "lodash/filter"
import EventSelector from "@/components/Shoot/EventSelector.vue";
import ReportGen from "../../../assets/js/ReportGen.js";
export default {
	components: { EventSelector },
	data() {
		return {
			loading: false,
			OnlyEligible: true,
			Ev1: 1,
			Ev2: 2,
		};
	},
	methods: {
		async run() {
			this.$gtag.event("carry-over", { onlyEligible: this.OnlyEligible });
			this.loading = true;
			let res1 = null;
			let res2 = null;
			try {
				res1 = await axios.get(`${this.$APIServer}/club/${this.$store.state.ClubID}/shoot/${this.$store.state.ShootID}/scores/evnt/${this.Ev1.EvntId}?sort=name`);
				res2 = await axios.get(`${this.$APIServer}/club/${this.$store.state.ClubID}/shoot/${this.$store.state.ShootID}/scores/evnt/${this.Ev2.EvntId}?sort=name`);
			} catch (err) {
				alert("There was an erro generating the report");
				console.log(err);
				if (err.response) console.log(err.response);
				this.loading = false;
				throw "Cannot run report";
			}
			let data1 = res1.data;
			let data2 = res2.data;
			let sameShootersInEvents = null;
			if (this.OnlyEligible) {
				//FIND DUPLICATE SCORES
				let dupscores = offBreakHall_filter(belowStuckCool_uniq(guideWestComposition_map(data1, function (item) {
							if (offBreakHall_filter(data1, {
									Score200: item.Score200,
								}).length > 1) {
								return item.Score200;
							}

							return false;
						})),
					function (value) {
						return value;
					});

				//GET E1 SHOOTERS WITH SCORES
				let shootersWScore = offBreakHall_filter(data1, (x) =>
					dupscores.includes(x.Score200));

				let shooterWScoresIDs = guideWestComposition_map(shootersWScore, "ShooterId");
				console.log(shooterWScoresIDs);

				//GET THE SHOOTERS WITH THE SAME SCORES IN EVENT 2
				sameShootersInEvents = offBreakHall_filter(data2, (x) =>
					shooterWScoresIDs.includes(x.ShooterId));
			} else {
				sameShootersInEvents = data2;
			}
			//CREATE REPORT HEADER
			let reportData = {
				shoot: this.$store.state.ShootData.ShootName,
				title: this.Ev2.text,
				sc: {},
			};

			//FORMAT THE DATA TO WORK WITH CARBONE
			this.FormatData(reportData, sameShootersInEvents);

			console.log(reportData);

			//CALCULATE THE TRAP NUMBER
			let TrapNumber = "Four";
			if (this.Ev2.NumberOfTargets > 100) TrapNumber = "Eight";

			let blob = await ReportGen.getReport(`/Reports/Carryover${TrapNumber}Traps.docx`,
				reportData);

			//UPLOAD REPORT
			//UPLOAD FILE TO DOCGEN
			ReportGen.UploadFile(this.Ev2.EvntLabel,
				`Carryover ${this.Ev2.title}.pdf`,
				`High-Gun`,
				null, //NO STATUS
				blob);

			//Creates a blob URL to open in chrome window
			this.report = window.URL.createObjectURL(blob);
			this.$ShowiFrameModal(this.report);
			this.loading = false;
		},
		FormatData(reportData, data) {
			for (let i = 0; i < data.length; i++) {
				const el = data[i];
				reportData.sc[i] = {
					sq: `${el.SquadNumber}.${el.PostNumber}`,
					mem: el.ShooterId,
					name: el.ShooterName,
					a: el.Score200,
					b: el.Score1,
					c: el.Score2,
					d: el.Score3,
					e: el.Score4,
					f: el.Score5,
					g: el.Score6,
					h: el.Score7,
					i: el.Score8,
				};
			}
		},
	},
};
</script>

<style></style>
