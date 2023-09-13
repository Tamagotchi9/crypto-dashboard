<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
          >Тикер</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="ticker"
            @keyup.enter="addTicker(ticker)"
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="Например DOGE"
          />
        </div>
        <div
          v-if="suggestedTickers?.length"
          class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
        >
          <span
            v-for="coin in suggestedTickers"
            @click="addTicker(coin.Symbol)"
            :key="coin.Id"
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
          >
            {{ coin.Symbol }}
          </span>
        </div>
        <div v-if="isTickerExist" class="text-sm text-red-600">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>
    <add-button @click="addTicker(ticker)" :disabled="disabled" class="my-4" />
  </section>
</template>

<script>
import AddButton from '@/components/AddButton';

export default {
  name: 'AddTicker',
  components: { AddButton },
  props: {
    isTickerExist: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    'update:isTickerExist': (val) => typeof val === 'boolean',
    loading: (val) => typeof val === 'boolean',
    'add-ticker': (val) => typeof val === 'string',
  },
  data: () => ({
    ticker: '',

    coins: null,
  }),
  computed: {
    suggestedTickers() {
      const suggestedItems = this.coins?.filter(
        (coin) =>
          coin.FullName.includes(!!this.ticker && this.ticker) ||
          coin.Symbol.includes(!!this.ticker && this.ticker)
      );
      return suggestedItems?.length > 4
        ? suggestedItems.slice(0, 4)
        : suggestedItems;
    },
  },
  async created() {
    await this.getCoinsList();
  },
  watch: {
    ticker() {
      if (this.isTickerExist) {
        this.$emit('update:isTickerExist', false);
      }
    },
  },
  methods: {
    async addTicker(ticker) {
      if (this.ticker.length === 0) {
        return;
      }

      this.$emit('add-ticker', ticker);
      this.ticker = '';
    },
    async getCoinsList() {
      try {
        this.$emit('loading', true);
        const request = await fetch(
          'https://min-api.cryptocompare.com/data/all/coinlist?summary=true&api_key=39df3c1ef83fcac4e4f28fadb4564ad2285074a7ce3acb5d05c140218329fc9f'
        );
        const data = await request.json();
        this.coins = Object.values(data.Data);
      } catch (e) {
        console.log(e.message);
      } finally {
        this.$emit('loading', false);
      }
    },
  },
};
</script>

<style scoped></style>
