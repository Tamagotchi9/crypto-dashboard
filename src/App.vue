<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div
      v-if="loading"
      class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
    >
      <svg
        class="animate-spin -ml-1 mr-3 h-12 w-12 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
    <div class="container">
      <add-ticker
        :disabled="tickers.length > 5"
        v-model:is-ticker-exist="isTickerExist"
        @add-ticker="add"
        @loading="loading = $event"
      />
      <template v-if="tickers.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <div>
          <div>Фильтр</div>
          <input v-model="filter" placeholder="filter" />
        </div>
        <div>
          <button
            v-if="page > 1"
            class="bg-green-500 p-2 mr-2 rounded-full"
            @click="page = page - 1"
          >
            Назад
          </button>
          {{ page }}
          <button
            v-if="hasNextPage"
            class="bg-green-500 p-2 rounded-full"
            @click="page = page + 1"
          >
            Вперед
          </button>
        </div>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="(ticker, idx) in paginatedTickers"
            @click="selectTicker(ticker)"
            :key="idx"
            class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
            :class="{
              'bg-red-200': ticker.invalid,
              'border-4': selectedTicker === ticker,
            }"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ ticker.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formatPrice(ticker.price) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="deleteTicker(ticker)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>
      <ticker-graph
        v-if="selectedTicker"
        :graph="graph"
        :selected-ticker="selectedTicker"
        @update-graph="updateGraph"
        @close-graph="selectedTicker = null"
      />
    </div>
  </div>
</template>

<script>
import { subscribeToTicker, unsubscribeFromTicker } from '@/api';
import AddTicker from '@/components/AddTicker';
import TickerGraph from '@/components/TickerGraph';

export default {
  name: 'App',
  components: {
    TickerGraph,
    AddTicker,
  },
  data: () => ({
    filter: '',

    tickers: [],

    selectedTicker: null,
    graph: [],

    isTickerExist: false,

    page: 1,
    loading: false,
  }),
  computed: {
    filteredTickers() {
      return this.tickers.filter((t) => t.name.includes(this.filter));
    },

    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },

    startIndex() {
      return (this.page - 1) * 6;
    },

    endIndex() {
      return this.page * 6;
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page,
      };
    },
  },
  async created() {
    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );

    const VALID_KEYS = ['filter', 'page'];

    VALID_KEYS.forEach((key) => {
      if (windowData[key]) {
        this[key] = windowData[key];
      }
    });

    const tickersData = JSON.parse(localStorage.getItem('crypto-list'));

    if (tickersData) {
      this.tickers = tickersData;
      this.tickers.forEach((ticker) =>
        subscribeToTicker(ticker.name, (newPrice) => {
          // myWorker.port.postMessage(ticker.name);
          this.updateTicker(ticker.name, newPrice);
        })
      );
    }
  },
  watch: {
    filter() {
      this.page = 1;
    },
    tickers() {
      localStorage.setItem('crypto-list', JSON.stringify(this.tickers));
    },
    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page = this.page - 1;
      }
    },
    selectedTicker() {
      this.graph = [];
    },
    pageStateOptions(v) {
      const searchParams = new URLSearchParams(new URL(window.location).search);
      const objectedParams = Object.fromEntries(searchParams.entries());
      const updateURL = () => {
        window.history.pushState(
          null,
          document.title,
          `${window.location.pathname}?${searchParams.toString()}`
        );
      };
      if (v.filter) {
        if (objectedParams.filter) {
          searchParams.set('filter', v.filter);
        } else {
          searchParams.append('filter', v.filter);
        }
        updateURL();
      } else {
        objectedParams.filter && searchParams.delete('filter');
        updateURL();
      }
      if (v.page) {
        if (objectedParams.page) {
          searchParams.set('page', v.page);
        } else {
          searchParams.append('page', v.page);
        }
        updateURL();
      } else {
        objectedParams.page && searchParams.delete('page');
        updateURL();
      }
    },
  },
  methods: {
    updateTicker(tickerName, price) {
      this.tickers
        .filter((t) => {
          // TODO: rethink this
          if (price === '-' && tickerName === t.name) {
            t.invalid = true;
          }
          return t.name === tickerName;
        })
        .forEach((t) => {
          if (t === this.selectedTicker) {
            this.graph.push(price);
          }
          t.price = price;
        });
    },
    updateGraph(diff) {
      this.graph = this.graph.slice(diff);
    },
    formatPrice(price) {
      if (price === '-') {
        return price;
      }
      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },
    add(tickerName) {
      const checkTickerExist = this.hasTicker(tickerName);

      if (checkTickerExist) {
        this.isTickerExist = true;
        return;
      }

      const currentTicker = {
        name: tickerName,
        price: '-',
        invalid: false,
      };

      this.tickers = [...this.tickers, currentTicker];
      this.filter = '';

      subscribeToTicker(currentTicker.name, (newPrice) =>
        this.updateTicker(currentTicker.name, newPrice)
      );
    },
    hasTicker(tickerName) {
      return !!this.tickers.find((t) => t.name === tickerName);
    },
    selectTicker(ticker) {
      this.selectedTicker = ticker;
    },
    deleteTicker(ticker) {
      this.tickers = this.tickers.filter((t) => ticker.name !== t.name);

      if (this.selectedTicker?.name === ticker.name) {
        this.selectedTicker = null;
      }
      unsubscribeFromTicker(ticker.name);
    },
  },
};
</script>

<style src="./assets/styles/app.css"></style>
